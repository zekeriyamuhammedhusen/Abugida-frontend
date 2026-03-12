import Enrollment from '../../models/Enrollment.js';
import Course from '../../models/Course.js';
import Progress from '../../models/Progress.js';

// Convert a simple range token into a start date
function resolveDateRange(range) {
  const now = new Date();
  if (!range) return null;

  const mapping = {
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

  const days = mapping[range];
  if (!days) return null;

  const start = new Date();
  start.setDate(now.getDate() - days);
  return start;
}

export const getInstructorEnrollmentsPerCourse = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const { range } = req.query;

    const startDate = resolveDateRange(range);

    const courses = await Course.find({ instructor: instructorId }).select('_id title category');

    const data = await Promise.all(
      courses.map(async (course) => {
        const match = { courseId: course._id };
        if (startDate) match.enrolledAt = { $gte: startDate };

        const count = await Enrollment.countDocuments(match);
        return {
          courseId: course._id,
          courseTitle: course.title,
          category: course.category || 'other',
          enrollments: count,
        };
      })
    );

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch enrollment data', error: err.message });
  }
};



export const getStudentProgressCompletion = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const { timeRange } = req.query;
    const startDate = resolveDateRange(timeRange);

    // Only consider progress for this instructor's courses
    const instructorCourses = await Course.find({ instructor: instructorId }).select('_id');
    const courseIds = instructorCourses.map((c) => c._id);

    if (!courseIds.length) {
      return res.status(200).json([
        { name: 'Completed', value: 0, count: 0 },
        { name: 'In Progress', value: 0, count: 0 },
        { name: 'Not Started', value: 0, count: 0 },
      ]);
    }

    const match = { courseId: { $in: courseIds } };
    if (startDate) {
      match.updatedAt = { $gte: startDate };
    }

    const progresses = await Progress.find(match).select('progressPercentage');

    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    progresses.forEach((progress) => {
      if (progress.progressPercentage >= 100) {
        completed++;
      } else if (progress.progressPercentage > 0) {
        inProgress++;
      } else {
        notStarted++;
      }
    });

    const total = completed + inProgress + notStarted;

    const data = [
      { name: 'Completed', value: total ? Math.round((completed / total) * 100) : 0, count: completed },
      { name: 'In Progress', value: total ? Math.round((inProgress / total) * 100) : 0, count: inProgress },
      { name: 'Not Started', value: total ? Math.round((notStarted / total) * 100) : 0, count: notStarted },
    ];

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

