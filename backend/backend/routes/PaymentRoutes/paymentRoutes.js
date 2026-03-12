import express from 'express';
import { 
  initiatePayment, 
  chapaWebhook, 
  verifyPayment, 
  generateReceipt 
} from '../../controllers/paymentController/paymentController.js';

import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Start payment
router.post('/initiate', protect, initiatePayment);

// Webhook (MUST be raw JSON) - use raw so signature verification can use the exact bytes
router.post('/webhook', express.raw({ type: 'application/json' }), chapaWebhook);

// Verify after user returns
router.get('/verify-payment/:tx_ref', verifyPayment);

// Download receipt
router.get('/receipt/:tx_ref', protect, generateReceipt);

export default router;
