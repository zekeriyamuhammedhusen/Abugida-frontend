import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons: { type: [String], default: [] }, // <-- Store lesson IDs as strings
  totalLessons: { type: Number, required: true }, 
  progressPercentage: { type: Number, default: 0 },  
  quizAttempts: {
    type: [
      {
        lessonId: { type: String, required: true },
        attempts: { type: Number, default: 0 },
        maxAttempts: { type: Number, default: 3 },
        locked: { type: Boolean, default: false },
        repurchaseRequired: { type: Boolean, default: false },
        lastScore: { type: Number, default: 0 },
      },
    ],
    default: [],
  },
}, { timestamps: true });

export default mongoose.model('Progress', progressSchema);
