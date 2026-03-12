import { Router } from "express";
import { translate } from "../controllers/translationController.js";

const router = Router();

// POST /api/translate
router.post("/", translate);

export default router;
