import express from 'express';
import {
  listPendingInstructorsSimple,
  approveInstructorSimple,
  rejectInstructorSimple,
} from '../../controllers/instructorApprovalController.js';
import { adminAuth } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/pending', adminAuth, listPendingInstructorsSimple);
router.put('/approve/:id', adminAuth, approveInstructorSimple);
router.delete('/reject/:id', adminAuth, rejectInstructorSimple);

export default router;
