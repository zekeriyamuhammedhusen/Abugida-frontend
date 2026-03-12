import Payment from '../../models/Transaction.js'; // Adjust the path as necessary
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

export const getInstructorDashboard = async (req, res) => {
    try {
      const instructorId = req.user._id;
      const { startDate, endDate, range, groupBy } = req.query;
  
      const matchStage = {
        instructorId: new mongoose.Types.ObjectId(instructorId),
      };
  
      const rangeStart = startDate && endDate ? null : resolveRange(range);

      if (startDate && endDate) {
        matchStage.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (rangeStart) {
        matchStage.createdAt = { $gte: rangeStart };
      }
  
      // High-level totals for the instructor (only active courses)
      const summaryResult = await Payment.aggregate([
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
            totalInstructorEarnings: { $sum: '$instructorShare' },
            totalPlatformRevenue: { $sum: '$platformShare' },
            totalReceived: { $sum: '$amountPaid' },
            uniqueStudents: { $addToSet: '$studentId' },
          },
        },
        {
          $project: {
            _id: 0,
            totalInstructorEarnings: 1,
            totalPlatformRevenue: 1,
            totalReceived: 1,
            uniqueStudentCount: { $size: '$uniqueStudents' },
          },
        },
      ]);

      const summary = summaryResult[0] || {
        totalInstructorEarnings: 0,
        totalPlatformRevenue: 0,
        totalReceived: 0,
        uniqueStudentCount: 0,
      };
  
      // Per Course Revenue with Student Name
      const perCourseRevenue = await Payment.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: '$student' },
        {
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course'
          }
        },
        { $unwind: '$course' },
        { $match: { 'course.isActive': true } },
        {
          $group: {
            _id: '$courseId',
            totalEarnings: { $sum: '$instructorShare' },
            totalPayments: { $sum: '$amountPaid' },
            studentIds: { $addToSet: '$studentId' },
            courseName: { $first: '$course.title' },
            students: { $addToSet: '$student.name' },
          },
        },
        {
          $project: {
            _id: 1,
            totalEarnings: 1,
            totalPayments: 1,
            courseName: 1,
            students: 1,
            studentCount: { $size: '$studentIds' },
          },
        },
      ]);

      // Optional monthly breakdown for charts
      let monthlyEarnings = [];
      if (groupBy === 'month') {
        monthlyEarnings = await Payment.aggregate([
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
              _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
              total: { $sum: '$instructorShare' },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
          {
            $project: {
              _id: 0,
              month: {
                $concat: [
                  { $toString: '$_id.year' },
                  '-',
                  {
                    $cond: [
                      { $lte: ['$_id.month', 9] },
                      { $concat: ['0', { $toString: '$_id.month' }] },
                      { $toString: '$_id.month' },
                    ],
                  },
                ],
              },
              value: { $round: ['$total', 2] },
            },
          },
        ]);
      }
  
      res.json({
        summary,
        perCourseRevenue,
        monthlyEarnings,
      });
    } catch (err) {
      console.error('Error in getInstructorDashboard:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
