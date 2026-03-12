import express from 'express';
import { updateProfile, updateUserPassword ,getProfile } from '../../controllers/user-Controller/userController.js';
import { protect } from '../../middleware/authMiddleware.js';
import { uploadImage } from '../../middleware/uploadMiddleware.js';

const router = express.Router();
router.get('/profile', protect, getProfile);
// Update account info
router.put(
  '/profile',
  protect,
  (req, res, next) => {
    // Only invoke multer when the request is multipart; avoid busboy errors on JSON bodies
    if (req.is('multipart/form-data')) {
      return uploadImage.single('profilePic')(req, res, next);
    }
    return next();
  },
  updateProfile
);

// Change password
router.put('/profile/password', protect, updateUserPassword);

export default router;
