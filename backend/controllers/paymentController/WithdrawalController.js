import User from '../../models/User.js';
import { testModeWithdrawal } from '../../utils/chapaTest.js';

import Withdrawal from '../../models/Withdrawal.js';
import Transaction from '../../models/Transaction.js';
import mongoose from 'mongoose';

function resolveRange(range) {
  const now = new Date();
  if (!range) return null;

  const map = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    week: 7,
    month: 30,
    quarter: 90,
  };

  if (range === 'ytd' || range === 'year') {
    return new Date(now.getFullYear(), 0, 1);
  }

  const days = map[range];
  if (!days) return null;

  const start = new Date();
  start.setDate(now.getDate() - days);
  return start;
}

export const instructorTestWithdraw = async (req, res) => {
  try {
    const { account_name, account_number, bank_code, amount, bank_name } = req.body;
    const instructor = await User.findById(req.user._id);
    if (!instructor) return res.status(404).json({ message: 'Instructor not found' });

    // Compute dynamic available balance (active courses income - withdrawals)
    const instructorId = new mongoose.Types.ObjectId(req.user._id);
    const incomeAgg = await Transaction.aggregate([
      { $match: { instructorId } },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: false } },
      { $match: { 'course.isActive': true } },
      { $group: { _id: null, total: { $sum: '$instructorShare' } } }
    ]);
    const totalIncome = incomeAgg[0]?.total || 0;

    const withdrawalsAgg = await Withdrawal.aggregate([
      { $match: { user: instructorId, status: { $in: ['pending', 'success'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawn = withdrawalsAgg[0]?.total || 0;
    const availableBalance = Math.max(0, totalIncome - totalWithdrawn);

    if (Number(amount) > availableBalance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Use simulation in dev or when CHAPA_SECRET_KEY is not set
    const simulate = !process.env.CHAPA_SECRET_KEY || process.env.NODE_ENV !== 'production';
    let result;
    try {
      if (simulate) {
        result = { status: 'success', message: 'Simulated withdrawal (test mode)', data: `Abugida-${Date.now()}-${Math.floor(Math.random() * 1000)}` };
      } else {
        result = await testModeWithdrawal({ account_name, account_number, bank_code, amount });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message || 'Withdrawal request failed' });
    }

    const reference = result?.data || `Abugida-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newWithdrawal = await Withdrawal.create({
      user: req.user._id,
      amount,
      reference,
      status: result.status === 'success' ? 'success' : 'failed',
      responseMessage: result.message,
      bankName: bank_name,
      accountNumber: account_number,
    });

    const remainingBalance = Number((availableBalance - Number(amount)).toFixed(2));

    return res.status(200).json({
      message: simulate ? 'Withdrawal successful (simulated)' : 'Withdrawal successful (test mode)',
      transaction: result,
      remainingBalance,
      withdrawal: newWithdrawal,
    });
  } catch (error) {
    console.error('Withdrawal Processing Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};


export const getWithdrawalHistory = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ withdrawals });
  } catch (error) {
    console.error('Error fetching withdrawal history:', error.message);
    return res.status(500).json({ error: error.message });
  }
};


export const getInstructorBalance = async (req, res) => {
  try {
    const instructorId = new mongoose.Types.ObjectId(req.user._id);
    const { startDate, endDate, range } = req.query;

    const matchStage = { instructorId };
    const effectiveRange = startDate && endDate ? null : (range || '30d');
    const rangeStart = startDate && endDate ? null : resolveRange(effectiveRange);

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (rangeStart) {
      matchStage.createdAt = { $gte: rangeStart };
    }

    // Sum of instructor shares for ACTIVE courses only (align with dashboard earnings)
    const incomeAgg = await Transaction.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: false } },
      { $match: { 'course.isActive': true } },
      {
        $group: {
          _id: null,
          total: { $sum: '$instructorShare' }
        }
      }
    ]);
    const totalActiveIncome = incomeAgg[0]?.total || 0;

    // Sum of withdrawals (pending or success) to avoid double spending
    const withdrawalMatch = { user: instructorId, status: { $in: ['pending', 'success'] } };
    if (matchStage.createdAt) {
      // Align withdrawal period with income period when a date filter is applied
      withdrawalMatch.createdAt = matchStage.createdAt;
    }

    const withdrawalsAgg = await Withdrawal.aggregate([
      { $match: withdrawalMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawn = withdrawalsAgg[0]?.total || 0;

    const balance = Math.max(0, totalActiveIncome - totalWithdrawn);

    return res.status(200).json({
      message: 'Instructor balance retrieved successfully',
      balance: Number(balance.toFixed(2)),
    });
  } catch (error) {
    console.error('Error retrieving instructor balance:', error.message);
    return res.status(500).json({ error: error.message });
  }
};


