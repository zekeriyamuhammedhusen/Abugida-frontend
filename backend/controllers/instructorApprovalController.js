import User from '../models/User.js';
import { sendEmail } from '../Email Service/emailService.js';

// List pending instructor applications
export const listPendingInstructorsSimple = async (req, res) => {
  try {
    const pending = await User.find({ role: 'instructor', isApproved: false })
      .select('name email phone cv expertise createdAt');
    return res.status(200).json({ pending });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Approve instructor
export const approveInstructorSimple = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'instructor') return res.status(400).json({ message: 'User is not an instructor' });
    if (user.isApproved) return res.status(400).json({ message: 'Already approved' });

    user.isApproved = true;
    user.status = 'active';
    await user.save();

    const subject = 'Instructor Application Approved';
    const text = `Hi ${user.name},\n\nYour instructor application has been approved.`;
    const html = `<p>Hi ${user.name},</p><p>Your instructor application has been approved.</p>`;
    await sendEmail(user.email, subject, text, html);

    return res.status(200).json({ message: 'Instructor approved' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reject instructor (delete or mark as rejected)
export const rejectInstructorSimple = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'instructor') return res.status(400).json({ message: 'User is not an instructor' });
    if (user.isApproved) return res.status(400).json({ message: 'Cannot reject an approved instructor' });

    // Option A: delete user
    await User.findByIdAndDelete(id);

    const subject = 'Instructor Application Rejected';
    const text = `Hi ${user.name},\n\nYour instructor application was not approved.`;
    const html = `<p>Hi ${user.name},</p><p>Your instructor application was not approved.</p>`;
    await sendEmail(user.email, subject, text, html);

    return res.status(200).json({ message: 'Instructor rejected and removed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
