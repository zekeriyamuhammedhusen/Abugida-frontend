import User from '../models/User.js';
import ApprovalLog from '../models/ApprovalLog.js';
import { sendEmail } from '../Email Service/emailService.js';

export const listPendingInstructors = async (req, res) => {
  try {
    const pending = await User.find({ role: 'instructor', isApproved: false })
      .select('name email phone cv expertise createdAt');
    return res.status(200).json({ pending });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const approveInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'instructor') return res.status(400).json({ message: 'User is not an instructor' });
    if (user.isApproved) return res.status(400).json({ message: 'Already approved' });

    user.isApproved = true;
    user.status = 'active';
    await user.save();

    await ApprovalLog.create({
      action: 'approve',
      instructorId: user._id,
      instructorName: user.name,
      instructorEmail: user.email,
      approverId: req.user._id,
      approverName: req.user.name,
      approverEmail: req.user.email,
    });

    const subject = 'Your Account Has Been Approved';
    const text = `Dear ${user.name},\n\nYour account has been approved. You can now access the platform as an instructor. If you have any questions, please contact support.`;
    const htmlContent = `
      <h1>Account Approved</h1>
      <p>Dear ${user.name},</p>
      <p>Your account has been approved. You can now access the platform as an instructor.</p>
      <p>If you have any questions, please contact support.</p>
    `;
    await sendEmail(user.email, subject, text, htmlContent);

    return res.json({ message: 'Instructor approved successfully!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const rejectInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const instructor = await User.findById(id);

    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    if (instructor.role !== 'instructor' || instructor.isApproved) {
      return res.status(400).json({ message: 'Instructor cannot be rejected or is already approved' });
    }

    await ApprovalLog.create({
      action: 'reject',
      instructorId: instructor._id,
      instructorName: instructor.name,
      instructorEmail: instructor.email,
      approverId: req.user._id,
      approverName: req.user.name,
      approverEmail: req.user.email,
    });

    await User.findByIdAndDelete(id);

    const subject = 'Your Account Approval Has Been Rejected';
    const text = `Dear ${instructor.name},\n\nYour account approval has been rejected. You will not be able to access the platform as an instructor. If you have any questions, please contact support.`;
    const htmlContent = `
      <h1>Account Approval Rejected</h1>
      <p>Dear ${instructor.name},</p>
      <p>Your account approval has been rejected. You will not be able to access the platform as an instructor.</p>
      <p>If you have any questions, please contact support.</p>
    `;

    await sendEmail(instructor.email, subject, text, htmlContent);

    return res.status(200).json({ message: 'Instructor rejected and deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getApprovedCount = async (req, res) => {
  try {
    const approvedCount = await User.countDocuments({ role: 'instructor', isApproved: true });
    return res.status(200).json({ approvedCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const listApprovedInstructors = async (req, res) => {
  try {
    const approved = await User.find({ role: 'instructor', isApproved: true })
      .select('name email phone expertise createdAt');
    return res.status(200).json({ approved });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
