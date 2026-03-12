import Enrollment from '../../models/Enrollment.js';
import Course from '../../models/Course.js';
import Progress from '../../models/Progress.js';
import Transaction from '../../models/Transaction.js';
import Review from '../../models/Review.js';

export const getStudentEnrollmentsPerCourse = async (req, res) => {
  try {
    const courses = await Course.find().select('_id title category');

    const data = await Promise.all(
      courses.map(async (course) => {
        const count = await Enrollment.countDocuments({ courseId: course._id });
        return {
          courseId: course._id,
          courseTitle: course.title,
          category: course.category, // Including category
          enrollments: count,
        };
      })
    );

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch enrollment data', error: err.message });
  }
};

// Course completion rates: percentage of students who finished each course
export const getCourseCompletionRates = async (_req, res) => {
  try {
    // Total enrolled students per course
    const enrollments = await Enrollment.aggregate([
      { $match: { courseId: { $ne: null } } },
      { $group: { _id: '$courseId', totalStudents: { $sum: 1 } } },
    ]);

    // Completed counts per course (progress >= 100%)
    const progressCompleted = await Progress.aggregate([
      { $match: { courseId: { $ne: null } } },
      {
        $group: {
          _id: '$courseId',
          completedCount: {
            $sum: { $cond: [{ $gte: ['$progressPercentage', 100] }, 1, 0] },
          },
        },
      },
    ]);

    const enrollMap = new Map(enrollments.map((e) => [String(e._id), e.totalStudents]));
    const completedMap = new Map(progressCompleted.map((p) => [String(p._id), p.completedCount]));

    // Use the union of courseIds from enrollments and completions
    const courseIds = Array.from(new Set([...enrollMap.keys(), ...completedMap.keys()]));

    if (!courseIds.length) {
      return res.status(200).json([]);
    }

    const courses = await Course.find({ _id: { $in: courseIds } }).select('_id title category');
    const courseCategoryMap = new Map(courses.map((c) => [String(c._id), c.category || 'Uncategorized']));
    const validIds = new Set(courses.map((c) => String(c._id)));

    const payload = courseIds
      // Ignore courses that no longer exist to avoid ghost/uncategorized counts
      .filter((courseId) => validIds.has(courseId))
      .map((courseId) => {
        const totalStudents = enrollMap.get(courseId) || 0;
        const completedCount = completedMap.get(courseId) || 0;
        const completionRate = totalStudents
          ? Math.round((completedCount / totalStudents) * 100)
          : 0;

        return {
          courseId,
          name: courseCategoryMap.get(courseId) || 'Uncategorized',
          completionRate,
          students: totalStudents,
        };
      });

    res.status(200).json(payload);
  } catch (err) {
    console.error('Failed to fetch course completion rates:', err);
    res.status(500).json({ message: 'Failed to fetch completion data', error: err.message });
  }
};

// Revenue growth by month (ETB) from Transaction.amountPaid
export const getRevenueGrowth = async (_req, res) => {
  try {
    const growth = await Transaction.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$amountPaid' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const data = growth.map((g) => ({
      month: monthNames[g._id.month - 1] + ' ' + g._id.year,
      revenue: g.revenue || 0,
    }));

    res.status(200).json(data);
  } catch (err) {
    console.error('Failed to fetch revenue growth:', err);
    res.status(500).json({ message: 'Failed to fetch revenue growth', error: err.message });
  }
};

// Course ratings & reviews per course
export const getCourseRatings = async (_req, res) => {
  try {
    const ratingsAgg = await Review.aggregate([
      {
        $group: {
          _id: '$course',
          avgRating: { $avg: '$rating' },
          reviews: { $sum: 1 },
        },
      },
    ]);

    if (!ratingsAgg.length) return res.status(200).json([]);

    const courseIds = ratingsAgg.map((r) => r._id);
    const courses = await Course.find({ _id: { $in: courseIds } }).select('_id title category');
    const courseNameMap = new Map(courses.map((c) => [String(c._id), c.title || c.category || 'Untitled Course']));

    const payload = ratingsAgg.map((r) => ({
      courseId: r._id,
      name: courseNameMap.get(String(r._id)) || 'Untitled Course',
      rating: Number((r.avgRating || 0).toFixed(1)),
      reviews: r.reviews || 0,
    }));

    res.status(200).json(payload);
  } catch (err) {
    console.error('Failed to fetch course ratings:', err);
    res.status(500).json({ message: 'Failed to fetch course ratings', error: err.message });
  }
};
