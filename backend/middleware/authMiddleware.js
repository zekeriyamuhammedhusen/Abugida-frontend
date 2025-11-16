import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// ---------------------------
// Admin authentication
// ---------------------------
export const adminAuth = async (req, res, next) => {
  try {
    let token;

    // Get token from HttpOnly cookie or Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    }

    if (!token) {
      console.warn('adminAuth: no token provided');
      return res.status(401).json({ message: 'No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: 'User not found' });

    if (user.blocked) return res.status(403).json({ message: "Your account has been blocked." });

    if (user.role !== 'admin') return res.status(403).json({ message: 'Access denied. Admins only.' });

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error("Admin Auth Error:", error);
    res.status(401).json({ message: 'Unauthorized. Invalid token.' });
  }
};

// ---------------------------
// Instructor authentication
// ---------------------------
export const instructor = (req, res, next) => {
  try {
    if (req.user && req.user.role === 'instructor') {
      return next();
    } else {
      return res.status(401).json({ message: 'Not authorized as an instructor' });
    }
  } catch (error) {
    console.error("Instructor Auth Error:", error);
    res.status(500).json({ message: "Server error in instructor middleware" });
  }
};

// ---------------------------
// General JWT protection middleware
// ---------------------------
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from HttpOnly cookie or Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return res.status(401).json({ message: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: 'User not found' });

    if (user.blocked) return res.status(403).json({ message: "Your account has been blocked." });

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error("Protect Middleware Error:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
