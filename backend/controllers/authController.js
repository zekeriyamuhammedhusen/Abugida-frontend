import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { sendEmail } from '../Email Service/emailService.js';
dotenv.config();

// Helper: create JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// REGISTER
export const registerUser = async (req, res) => {
  const { name, email, phone, role, expertise, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = new User({
      name,
      email,
      phone,
      role,
      expertise: role === 'instructor' ? expertise : null,
      cv: role === 'instructor' ? req.file?.path : null,
      password,
    });

    await user.save();

    // Generate OTP for email verification
    const otp = user.generateOTP();
    await user.save();
    await sendEmail(email, 'Your OTP Code', `Your OTP code is: ${otp}`);

    res.status(201).json({ message: 'Registration successful! Check your email for OTP.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  const { email, password, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    if (user.blocked) return res.status(403).json({ message: "Your account has been blocked" });

    // Email verification
    if (!user.isVerified) {
      if (!otp) {
        const generatedOtp = user.generateOTP();
        await user.save();
        await sendEmail(user.email, 'Your OTP Code', `Your OTP code is: ${generatedOtp}`);
        return res.status(400).json({ message: "OTP required. Check your email." });
      }
      if (!user.verifyOTP(otp)) return res.status(400).json({ message: "Invalid or expired OTP" });
      user.isVerified = true;
      await user.save();
    }

    // Instructor approval check
    if (user.role === "instructor" && !user.isApproved) {
      return res.status(403).json({ message: "Pending approval by admin" });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Store token in HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// LOGOUT
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET CURRENT USER
export const getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
