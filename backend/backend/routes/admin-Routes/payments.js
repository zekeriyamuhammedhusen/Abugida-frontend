import express from 'express';
import { adminAuth, protect } from '../../middleware/authMiddleware.js';
import { listTransactions, listPayouts } from '../../controllers/admin-conroller/paymentsController.js';

const router = express.Router();

router.use(protect, adminAuth);
router.get('/transactions', listTransactions);
router.get('/payouts', listPayouts);

export default router;
