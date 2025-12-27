import mongoose from 'mongoose';

const lessonAccessSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  isAccessible: { type: Boolean, default: false },  
}, { timestamps: true });

const LessonAccess = mongoose.model('LessonAccess', lessonAccessSchema);
export default LessonAccess;
