import express from "express";
import {
  listPendingInstructors,
  listActiveInstructors,
  listAllUsers,
  getUsersByRole,
  updateUserRole,
  blockUser,
  unblockUser,
  getUserById,
  getPlatformStats,
  createApprover,
  listApprovalLogs,
  listApprovers,
  deleteApprover,
  deleteUser,
} from "../../controllers/admin-conroller/adminController.js";
import { adminAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/pending-instructors", adminAuth, listPendingInstructors);

router.get("/active-instructors", adminAuth, listActiveInstructors);

router.get("/all-users", adminAuth, listAllUsers);
router.get("/role/:role", adminAuth, getUsersByRole);
router.put("/users/:id/role", adminAuth, updateUserRole);
router.delete("/users/:id", adminAuth, deleteUser);
router.post("/approvers", adminAuth, createApprover);
router.get("/approvers", adminAuth, listApprovers);
router.delete("/approvers/:id", adminAuth, deleteApprover);
router.get("/approval-logs", adminAuth, listApprovalLogs);
router.put("/block/:id", blockUser);
router.put("/unblock/:id", unblockUser);
router.get("/stats", adminAuth, getPlatformStats);
router.get("/:id([0-9a-fA-F]{24})", getUserById);

export default router;
