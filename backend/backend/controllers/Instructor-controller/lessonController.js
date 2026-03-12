import asyncHandler from 'express-async-handler';
import Lesson from '../../models/Lesson.js';
import Enrollment from '../../models/Enrollment.js';
import Module from '../../models/Module.js';
import QuizQuestion from '../../models/QuizQuestion.js';
import { processVideo } from '../../services/videoProcessing.js';
import { deleteFromCloudinary } from '../../services/cloudStorage.js';

// @desc    Get lesson by ID (student access)
// @route   GET /api/lessons/:id
// @access  Private/Student
export const getLessonById = asyncHandler(async (req, res) => {
  const lessonId = req.params.id;
  const userId = req.user?._id;

  try {
    // Check if lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // Determine access based on enrollment, free flag, or instructor ownership
    const lessonPop = await Lesson.findById(lessonId)
      .populate({ path: 'module', populate: { path: 'course', select: 'instructor title' } })
      .lean();

    if (!lessonPop) return res.status(404).json({ success: false, message: 'Lesson not found' });

    // Build Cloudinary playback candidates
    if (lessonPop.video && lessonPop.video.url) {
      const url = lessonPop.video.url;
      lessonPop.video = Object.assign({}, lessonPop.video || {}, {
        playbackCandidates: { hls: null, mp4: url, playbackUrl: url }
      });
    }

    const course = lessonPop.module?.course;

    // Free lesson: allow and still return module + progress if available
    if (lessonPop.free) {
      // gather module lessons
      const moduleLessons = await Lesson.find({ module: lessonPop.module._id }).sort({ position: 1 }).lean();
      // try to get progress (if authenticated)
      let progressData = null;
      if (userId) {
        const Progress = await import('../../models/Progress.js');
        const progress = await Progress.default.findOne({ studentId: userId, courseId: course?._id }).lean();
        if (progress) {
          // If progress.totalLessons is missing or zero, compute a fallback from module lessons
          if (!progress.totalLessons || progress.totalLessons === 0) {
            const totalLessonsFallback = moduleLessons ? moduleLessons.length : 0;
            const completedCount = Array.isArray(progress.completedLessons) ? progress.completedLessons.length : 0;
            const percentage = totalLessonsFallback > 0 ? parseFloat(((completedCount / totalLessonsFallback) * 100).toFixed(2)) : 0;
            progress.totalLessons = totalLessonsFallback;
            progress.progressPercentage = percentage;
          }
          progressData = progress;
        }
      }
      console.debug('getLessonById: moduleLessons=', moduleLessons ? moduleLessons.length : 0, 'progress=', progressData ? { totalLessons: progressData.totalLessons, completed: (progressData.completedLessons || []).length, progressPercentage: progressData.progressPercentage } : null);
      return res.json({ lesson: lessonPop, module: { ...lessonPop.module, lessons: moduleLessons }, progress: progressData });
    }

    // Instructor of the course: allow
    if (req.user && course && course.instructor && req.user._id && req.user._id.toString() === course.instructor.toString()) {
      const moduleLessons = await Lesson.find({ module: lessonPop.module._id }).sort({ position: 1 }).lean();
      console.debug('getLessonById (instructor): moduleLessons=', moduleLessons ? moduleLessons.length : 0);
      return res.json({ lesson: lessonPop, module: { ...lessonPop.module, lessons: moduleLessons }, progress: null });
    }

    // Check enrollment for student
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const enrollment = await Enrollment.findOne({ studentId: userId, courseId: course?._id });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You do not have access to this lesson' });
    }

    // Fetch module lessons and progress for enrolled student
    const moduleLessons = await Lesson.find({ module: lessonPop.module._id }).sort({ position: 1 }).lean();
    const Progress = await import('../../models/Progress.js');
    // Try to find an existing progress doc (not lean so we can create if missing)
    let progressDoc = await Progress.default.findOne({ studentId: userId, courseId: course?._id });

    // If not found, create an empty progress record (so UI can show 0/N)
    if (!progressDoc) {
      const totalLessonsFallback = moduleLessons ? moduleLessons.length : 0;
      try {
        progressDoc = await Progress.default.create({
          studentId: userId,
          courseId: course?._id,
          completedLessons: [],
          totalLessons: totalLessonsFallback,
          progressPercentage: 0
        });
      } catch (createErr) {
        console.error('Failed to create fallback progress:', createErr?.message || createErr);
      }
    }

    // Normalize to plain object for response and compute fallback totals if needed
    let progressToReturn = null;
    if (progressDoc) {
      const progressObj = progressDoc.toObject ? progressDoc.toObject() : progressDoc;
      if (!progressObj.totalLessons || progressObj.totalLessons === 0) {
        const totalLessonsFallback = moduleLessons ? moduleLessons.length : 0;
        const completedCount = Array.isArray(progressObj.completedLessons) ? progressObj.completedLessons.length : 0;
        const percentage = totalLessonsFallback > 0 ? parseFloat(((completedCount / totalLessonsFallback) * 100).toFixed(2)) : 0;
        progressObj.totalLessons = totalLessonsFallback;
        progressObj.progressPercentage = percentage;
      }
      progressToReturn = progressObj;
    }

    console.debug('getLessonById (student): moduleLessons=', moduleLessons ? moduleLessons.length : 0, 'progress=', progressToReturn ? { totalLessons: progressToReturn.totalLessons, completed: (progressToReturn.completedLessons || []).length, progressPercentage: progressToReturn.progressPercentage } : null);

    return res.json({ lesson: lessonPop, module: { ...lessonPop.module, lessons: moduleLessons }, progress: progressToReturn || null });
  } catch (err) {
    console.error('getLessonById error:', {
      message: err?.message,
      stack: err?.stack
    });
    return res.status(500).json({ success: false, message: 'Failed to retrieve lesson', error: err?.message });
  }
});

// @desc    Create a new lesson
// @route   POST /api/lessons
// @access  Private/Instructor
export const createLesson = asyncHandler(async (req, res) => {
  const { title, description, moduleId, type } = req.body;

  const module = await Module.findById(moduleId).populate('course');
  
  if (!module) {
    res.status(404);
    throw new Error('Module not found');
  }

  if (module.course.instructor.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to add lessons to this module');
  }

  // Get the next position number
  const lessonCount = await Lesson.countDocuments({ module: moduleId });
  const position = lessonCount + 1;

  const lesson = new Lesson({
    title,
    description,
    module: moduleId,
    type: type || 'video',
    position
  });

  const createdLesson = await lesson.save();
  res.status(201).json(createdLesson);
});

// @desc    Upload video for lesson
// @route   PUT /api/lessons/:id/video
// @access  Private/Instructor
export const uploadLessonVideo = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).populate({
    path: 'module',
    populate: {
      path: 'course'
    }
  });

  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  if (lesson.module.course.instructor.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this lesson');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('No video file uploaded');
  }

  try {
    // Delete old video if exists
    if (lesson.video?.publicId) {
      await deleteFromCloudinary(lesson.video.publicId, 'video');
      if (lesson.video.thumbnailPublicId) {
        await deleteFromCloudinary(lesson.video.thumbnailPublicId);
      }
    }

    // Process video (generate thumbnail, get duration, upload to cloud)
    const videoData = await processVideo(req.file.path, {
      public_id: `course-${lesson.module.course._id}/module-${lesson.module._id}/lesson-${lesson._id}`,
      resource_type: 'video'
    });

    // Ensure duration is a valid number
    let durationSeconds = Number(videoData.duration);
    if (!durationSeconds || isNaN(durationSeconds) || durationSeconds < 1) {
      durationSeconds = await getVideoDuration(req.file.path);
    }
    lesson.video = {
      url: videoData.videoUrl,
      publicId: videoData.videoPublicId,
      thumbnailUrl: videoData.thumbnailUrl,
      thumbnailPublicId: videoData.thumbnailPublicId
    };
    lesson.duration = formatDuration(durationSeconds);
    lesson.type = 'video';

    const updatedLesson = await lesson.save();
    res.json(updatedLesson);
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500);
    throw new Error('Failed to process video');
  }
});

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private/Instructor
export const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).populate({
    path: 'module',
    populate: {
      path: 'course'
    }
  });

  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  if (lesson.module.course.instructor.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this lesson');
  }

  const { title, description, content, free } = req.body;

  lesson.title = title || lesson.title;
  lesson.description = description || lesson.description;
  lesson.content = content || lesson.content;
  lesson.free = free !== undefined ? free : lesson.free;

  const updatedLesson = await lesson.save();
  res.json(updatedLesson);
});

// @desc    Reorder lessons
// @route   PUT /api/lessons/:moduleId/reorder
// @access  Private/Instructor
export const reorderLessons = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const { lessonIds } = req.body;

  const module = await Module.findById(moduleId).populate('course');
  
  if (!module) {
    res.status(404);
    throw new Error('Module not found');
  }

  if (module.course.instructor.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to reorder lessons in this module');
  }

  // Update positions based on the order of lessonIds
  const bulkOps = lessonIds.map((lessonId, index) => ({
    updateOne: {
      filter: { _id: lessonId, module: moduleId },
      update: { $set: { position: index + 1 } }
    }
  }));

  await Lesson.bulkWrite(bulkOps);

  const updatedLessons = await Lesson.find({ module: moduleId })
    .sort({ position: 1 });

  res.json(updatedLessons);
});

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private/Instructor
export const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).populate({
    path: 'module',
    populate: {
      path: 'course'
    }
  });

  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  if (lesson.module.course.instructor.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this lesson');
  }

  // Delete video if exists
  if (lesson.video?.publicId) {
    await deleteFromCloudinary(lesson.video.publicId, 'video');
    if (lesson.video.thumbnailPublicId) {
      await deleteFromCloudinary(lesson.video.thumbnailPublicId);
    }
  }

  // Delete quiz questions if exists
  if (lesson.quizQuestions?.length > 0) {
    await QuizQuestion.deleteMany({ _id: { $in: lesson.quizQuestions } });
  }

  await lesson.deleteOne();
  
  // Recalculate positions for remaining lessons
  const remainingLessons = await Lesson.find({ module: lesson.module._id })
    .sort({ position: 1 });

  for (let i = 0; i < remainingLessons.length; i++) {
    remainingLessons[i].position = i + 1;
    await remainingLessons[i].save();
  }

  res.json({ message: 'Lesson removed' });
});

// @desc    Convert lesson type
// @route   PUT /api/lessons/:id/convert
// @access  Private/Instructor
export const convertLessonType = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).populate({
    path: 'module',
    populate: {
      path: 'course'
    }
  });
  const { newType } = req.body;

  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  if (lesson.module.course.instructor.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this lesson');
  }

  if (lesson.type === newType) {
    res.status(400);
    throw new Error('Lesson is already of this type');
  }

  if (newType === 'quiz') {
    // Convert from video to quiz
    if (lesson.video?.publicId) {
      await deleteFromCloudinary(lesson.video.publicId, 'video');
      if (lesson.video.thumbnailPublicId) {
        await deleteFromCloudinary(lesson.video.thumbnailPublicId);
      }
    }
    
    lesson.video = undefined;
    lesson.duration = '15:00'; // Default quiz duration
    lesson.type = 'quiz';
  } else {
    // Convert from quiz to video
    if (lesson.quizQuestions?.length > 0) {
      await QuizQuestion.deleteMany({ _id: { $in: lesson.quizQuestions } });
    }
    
    lesson.quizQuestions = [];
    lesson.duration = '0:00';
    lesson.type = 'video';
  }

  const updatedLesson = await lesson.save();
  res.json(updatedLesson);
});

// Helper function to format duration (seconds to MM:SS)
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}