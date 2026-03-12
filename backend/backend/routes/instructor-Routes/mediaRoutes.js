import express from 'express';
import {
  uploadMedia,
  getUploadedMedia,
  assignVideoToLesson,
  replaceLessonVideo,
  deleteMedia,
  getVideoPreview,
  checkAssignedVideo,
  mediaDiagnostics
} from '../../controllers/Instructor-controller/mediaController.js';
import { protect, instructor } from '../../middleware/authMiddleware.js';
import { uploadVideo } from '../../middleware/uploadToCloudinary.js';
 
const router = express.Router();

router.route('/')
  .get(protect, instructor, getUploadedMedia)
  .post(protect, instructor, uploadVideo.single('video'), uploadMedia);

router.route('/assign/:lessonId')
  .put(protect, instructor, assignVideoToLesson);

// Diagnostics endpoint (ffmpeg / cloudinary)
router.route('/diagnostics')
  .get(/*protect, instructor,*/ mediaDiagnostics);

// Check assigned video exists in Cloudinary
router.route('/check/:lessonId')
  .get(protect, instructor, checkAssignedVideo);

router.route('/replace/:lessonId')
  .put(protect, instructor, uploadVideo.single('video'), replaceLessonVideo);

router.route('/:id')
  .get(protect, instructor, getVideoPreview)
  .delete(protect, instructor, deleteMedia);

export default router;