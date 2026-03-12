import mongoose from 'mongoose';

const approvalLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['approve', 'reject'],
      required: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    instructorName: { type: String, required: true },
    instructorEmail: { type: String, required: true },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approverName: { type: String, required: true },
    approverEmail: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('ApprovalLog', approvalLogSchema);
