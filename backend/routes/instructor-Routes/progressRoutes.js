import express from 'express';
import { 
  updateProgress, 
  getCompletedLessons, 
  getProgressData, 
  getAllStudentsProgress, 
  getCourseProgressSummary,
  getQuizAttemptStatus,
  recordQuizAttempt,
} from '../../controllers/Instructor-controller/progressController.js';

const router = express.Router();

// Update student progress
router.post('/', updateProgress);

// Track quiz attempts and lock after max tries
router.post('/quiz-attempt', recordQuizAttempt);
router.get('/quiz-attempt/:studentId/:courseId/:lessonId', getQuizAttemptStatus);

// Get completed lessons for a student in a course
router.get('/:studentId/:courseId/completedLessons', getCompletedLessons);

// Get progress data for a specific student in a course
router.get('/:studentId/:courseId', getProgressData);

// Get progress summary for all students in a course
router.get('/all-progress/:courseId', getAllStudentsProgress);

// Get course progress summary (e.g., average progress, student count)
router.get('/:courseId/summary', getCourseProgressSummary);

export default router;
