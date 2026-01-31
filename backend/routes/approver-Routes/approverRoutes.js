import express from 'express';
import { approverAuth } from '../../middleware/authMiddleware.js';
import {
  listPendingInstructors,
  approveInstructor,
  rejectInstructor,
  getApprovedCount,
  listApprovedInstructors,
} from '../../controllers/approverController.js';

const router = express.Router();

router.get('/instructors/pending', approverAuth, listPendingInstructors);
router.get('/instructors/approved', approverAuth, listApprovedInstructors);
router.get('/instructors/approved-count', approverAuth, getApprovedCount);
router.put('/instructors/approve/:id', approverAuth, approveInstructor);
router.delete('/instructors/reject/:id', approverAuth, rejectInstructor);

export default router;
