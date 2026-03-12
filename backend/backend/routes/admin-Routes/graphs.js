import express from 'express';
import { getStudentEnrollmentsPerCourse, getCourseCompletionRates, getRevenueGrowth, getCourseRatings } from '../../controllers/graphs/admin.js';
import { protect, adminAuth } from '../../middleware/authMiddleware.js';

const adminRouter = express.Router();
adminRouter.use(protect, adminAuth);
adminRouter.get('/enrollments-per-course', getStudentEnrollmentsPerCourse);
adminRouter.get('/completion-rates', getCourseCompletionRates);
adminRouter.get('/revenue-growth', getRevenueGrowth);
adminRouter.get('/course-ratings', getCourseRatings);

export default adminRouter;