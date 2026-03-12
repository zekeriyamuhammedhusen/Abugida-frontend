import Transaction from '../../models/Transaction.js';
import Withdrawal from '../../models/Withdrawal.js';
import Payment from '../../models/Payment.js';
import Course from '../../models/Course.js';

export const listTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find().sort({ createdAt: -1 })
      .populate('studentId', 'name email')
      .populate('instructorId', 'name email')
      .populate({ path: 'courseId', select: 'title instructor', populate: { path: 'instructor', select: 'name email' } })
      .populate('paymentId', 'tx_ref status createdAt amount');

    const txMapped = txs.map(tx => ({
      id: tx.paymentId?.tx_ref || `TX-${tx._id.toString().slice(-6)}`,
      date: tx.createdAt || tx.paymentId?.createdAt,
      student: tx.studentId?.name || 'Unknown',
      course: tx.courseId?.title || 'Unknown',
      amount: Number(tx.amountPaid || tx.paymentId?.amount || 0),
      instructor: tx.instructorId?.name || tx.courseId?.instructor?.name || 'Unknown',
      status: tx.paymentId?.status || 'completed'
    }));

    let result = txMapped;
    if (!txMapped.length) {
      const pays = await Payment.find({ status: 'success' }).sort({ createdAt: -1 })
        .populate('studentId', 'name email')
        .populate({ path: 'courseId', select: 'title instructor', populate: { path: 'instructor', select: 'name email' } });

      result = pays.map(p => ({
        id: p.tx_ref || `PAY-${p._id.toString().slice(-6)}`,
        date: p.createdAt,
        student: p.studentId?.name || 'Unknown',
        course: p.courseId?.title || 'Unknown',
        amount: Number(p.amount || 0),
        instructor: p.courseId?.instructor?.name || 'Unknown',
        status: p.status || 'success'
      }));
    }

    res.json(result);
  } catch (err) {
    console.error('Admin listTransactions error:', err.message);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

export const listPayouts = async (req, res) => {
  try {
    const payouts = await Withdrawal.find().sort({ createdAt: -1 })
      .populate('user', 'name');

    // For each instructor, count distinct courses with transactions
    const mapCoursesCount = {};
    const instructorIds = [...new Set(payouts.map(p => p.user?._id).filter(Boolean))];
    if (instructorIds.length) {
      const agg = await Transaction.aggregate([
        { $match: { instructorId: { $in: instructorIds } } },
        { $group: { _id: { instructorId: '$instructorId', courseId: '$courseId' } } },
        { $group: { _id: '$_id.instructorId', courses: { $sum: 1 } } }
      ]);
      agg.forEach(row => { mapCoursesCount[row._id.toString()] = row.courses; });
    }

    const result = payouts.map(p => ({
      id: p.reference || `PO-${p._id.toString().slice(-6)}`,
      date: p.createdAt,
      instructor: p.user?.name || 'Unknown',
      amount: Number(p.amount || 0),
      courses: mapCoursesCount[p.user?._id?.toString()] || 0,
      status: p.status || 'pending'
    }));

    res.json(result);
  } catch (err) {
    console.error('Admin listPayouts error:', err.message);
    res.status(500).json({ message: 'Failed to fetch payouts' });
  }
};
