import express from "express";
import {
  listPendingInstructors,
  listActiveInstructors,
  listAllUsers,
  getUsersByRole,
  blockUser,
  unblockUser,
  getUserById,
  getPlatformStats,
  createApprover,
  listApprovalLogs,
  listApprovers,
  deleteApprover,
} from "../../controllers/admin-conroller/adminController.js";
import { adminAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/pending-instructors", adminAuth, listPendingInstructors);

router.get("/active-instructors", adminAuth, listActiveInstructors);

router.get("/all-users", adminAuth, listAllUsers);
router.get("/role/:role", adminAuth, getUsersByRole);
router.post("/approvers", adminAuth, createApprover);
router.get("/approvers", adminAuth, listApprovers);
router.delete("/approvers/:id", adminAuth, deleteApprover);
router.get("/approval-logs", adminAuth, listApprovalLogs);
router.put("/block/:id", blockUser);
router.put("/unblock/:id", unblockUser);
router.get("/stats", adminAuth, getPlatformStats);
router.get("/:id([0-9a-fA-F]{24})", getUserById);

export default router;
