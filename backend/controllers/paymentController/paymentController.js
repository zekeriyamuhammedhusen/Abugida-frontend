import axios from 'axios';
import crypto from 'crypto';
import Payment from '../../models/Payment.js';
import Enrollment from '../../models/Enrollment.js';
import Transaction from '../../models/Transaction.js';
import Course from '../../models/Course.js';
import User from '../../models/User.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================
   Helper: drawConsolidatedTable
   Draws small labeled rows into PDFDocument.
   Returns the Y position after drawing.
   ============================ */
function drawConsolidatedTable(doc, sections, startX = 50, startY = 130, lineHeight = 16) {
  let y = startY;

  sections.forEach((section) => {
    // Section title
    doc.fontSize(12).fillColor('#2C3E50').text(section.title, startX, y);
    y += lineHeight;

    section.rows.forEach((row) => {
      // label
      doc.fontSize(10).fillColor('#7f8c8d').text(`${row.label}:`, startX, y, { continued: true });
      // value
      const valueX = startX + 150;
      const valueOpts = { width: 350 };
      if (row.highlight) {
        doc.fontSize(11).fillColor('#000').text(String(row.value), valueX, y, valueOpts);
      } else {
        doc.fontSize(10).fillColor('#34495e').text(String(row.value), valueX, y, valueOpts);
      }
      y += lineHeight;
    });

    y += 8; // space between sections
    // horizontal rule
    doc.moveTo(startX, y).lineTo(550, y).stroke('#e0e0e0').lineWidth(0.5);
    y += 12;
  });

  return y;
}

/* ============================
   INITIATE PAYMENT
   Creates Payment (pending) and initializes Chapa transaction
   ============================ */
export const initiatePayment = async (req, res) => {
  const { amount, email, fullName, courseId } = req.body;
  const studentId = req.user?._id;
  const tx_ref = `Abugida-${Date.now()}`;

  // Normalize and validate amount
  const amountNum = Number(amount);
  if (Number.isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ error: 'Invalid amount. Amount must be a positive number.' });
  }

  if (!studentId) {
    return res.status(401).json({ error: 'Unauthorized. Student ID missing.' });
  }

  if (!amount || !email || !fullName || !courseId) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (!process.env.BACKEND_URL || !process.env.CHAPA_SECRET_KEY || !process.env.FRONTEND_URL) {
    console.error('Missing required environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // create DB record
    await Payment.create({
      studentId,
      courseId,
      amount: amountNum,
      tx_ref,
      status: 'pending',
    });

    // initialize with Chapa (use numeric amount)
    const initPayload = {
      amount: amountNum,
      currency: 'ETB',
      email,
      first_name: fullName,
      tx_ref,
      callback_url: `${process.env.BACKEND_URL}/api/payment/webhook`,
      return_url: `${process.env.FRONTEND_URL}/payment-success?course=${courseId}&tx_ref=${tx_ref}`,
      customization: {
        title: 'Abugida Payment',
        description: 'Payment for Course Enrollment',
      },
    };

    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      initPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const chapaRes = response.data;
    console.log('Chapa initialize response:', chapaRes);

    if (chapaRes?.status === 'success' && chapaRes?.data?.checkout_url) {
      return res.status(200).json({ checkoutUrl: chapaRes.data.checkout_url, tx_ref });
    } else {
      console.error('CHAPA Init failed:', chapaRes);
      return res.status(400).json({ error: 'Failed to initialize payment', details: chapaRes });
    }
  } catch (error) {
    console.error('CHAPA Error Response:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Payment initiation failed', details: error.response?.data || error.message });
  }
};

/* ============================
   CHAPA WEBHOOK
   Expects express.json() so req.body is parsed JSON.
   Chapa format:
     { status: "success", data: { status: "success", tx_ref: "...", ... } }
   ============================ */
export const chapaWebhook = async (req, res) => {
  // When using express.raw middleware, req.body is a Buffer containing the raw JSON bytes.
  const rawBody = req.body;

  console.log('Webhook Received headers:', req.headers);

  // If we have a raw Buffer, try to verify signature if configured
  let parsedBody;
  try {
    if (Buffer.isBuffer(rawBody)) {
      // Verify signature if secret provided
      const secret = process.env.CHAPA_WEBHOOK_SECRET;
      if (secret) {
        // Accept common header names
        const sigHeader = req.headers['x-chapa-signature'] || req.headers['x-signature'] || req.headers['x-hub-signature'] || req.headers['signature'];
        if (!sigHeader) {
          console.warn('CHAPA webhook secret configured but no signature header present');
          return res.status(400).send('Missing signature');
        }

        // Some providers prefix the signature with algo (e.g., 'sha256=...'). Handle that.
        const receivedSig = String(sigHeader).replace(/^sha256=/i, '').trim();
        const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(receivedSig, 'hex'))) {
          console.error('Webhook signature mismatch');
          return res.status(401).send('Invalid signature');
        }
      }

      parsedBody = JSON.parse(rawBody.toString('utf8'));
    } else {
      // Fallback: body already parsed as JSON (if someone changed middleware)
      parsedBody = req.body;
    }
  } catch (err) {
    console.error('Failed to parse webhook body or verify signature:', err.message);
    return res.status(400).send('Invalid payload');
  }

  console.log('Webhook Received body:', JSON.stringify(parsedBody, null, 2));

  // Validate Chapa success
  if (!parsedBody || parsedBody.status !== 'success' || parsedBody.data?.status !== 'success') {
    console.error('Invalid webhook event or status', { parsedBody });
    return res.status(400).send('Invalid webhook');
  }

  const data = parsedBody.data;
  const tx_ref = data.tx_ref?.toString()?.trim();

  try {
    // Find existing payment first to support idempotency checks
    let payment = await Payment.findOne({ tx_ref });

    if (!payment) {
      console.error('Payment not found for tx_ref:', tx_ref);
      return res.status(404).send('Payment not found');
    }

    // If already marked success, skip processing
    if (payment.status === 'success') {
      console.log('Webhook: payment already marked success for tx_ref:', tx_ref);
      return res.status(200).send('Already processed');
    }

    // Update payment record to success and attach Chapa data
    const updatedPayment = await Payment.findByIdAndUpdate(
      payment._id,
      { status: 'success', chapaData: data },
      { new: true }
    );
    payment = updatedPayment;

    // Prevent duplicate transaction processing
    const existingTx = await Transaction.findOne({ paymentId: payment._id });
    if (existingTx) {
      console.log('Transaction already exists for paymentId:', payment._id);
      return res.status(200).send('Already processed');
    }

    // Ensure course exists
    const course = await Course.findById(payment.courseId);
    if (!course) {
      console.error('Course not found for courseId:', payment.courseId);
      return res.status(404).send('Course not found');
    }
    const instructorId = course.instructor;

    if (!instructorId) {
      console.error('Instructor not found for course:', payment.courseId);
      return res.status(404).send('Instructor not found for the course');
    }

    // Payment splitting
    const instructorShare = Number(payment.amount) * 0.8;
    const platformShare = Number(payment.amount) * 0.2;

    // Create transaction
    const tx = await Transaction.create({
      studentId: payment.studentId,
      courseId: payment.courseId,
      instructorId,
      paymentId: payment._id,
      amountPaid: payment.amount,
      instructorShare,
      platformShare,
      status: 'completed',
    });

    console.log('Transaction created:', tx._id);

    // Update instructor balance
    await User.findByIdAndUpdate(instructorId, { $inc: { availableBalance: instructorShare } });
    console.log('Instructor balance updated for instructorId:', instructorId);

    // Create enrollment if not exists
    const alreadyEnrolled = await Enrollment.findOne({
      studentId: payment.studentId,
      courseId: payment.courseId,
    });

    if (!alreadyEnrolled) {
      await Enrollment.create({
        studentId: payment.studentId,
        courseId: payment.courseId,
        paymentId: payment._id,
        enrolledAt: new Date(),
      });
      console.log('Enrollment created for studentId:', payment.studentId);
    } else {
      console.log('Student already enrolled for courseId:', payment.courseId);
    }

    // Respond 200 to Chapa
    return res.status(200).send('Payment, transaction, and enrollment successful');
  } catch (error) {
    console.error('Webhook Processing Error:', error.message, error.stack);
    return res.status(500).send('Server error');
  }
};

/* ============================
   VERIFY PAYMENT
   Used when user returns to frontend (optional)
   ============================ */
export const verifyPayment = async (req, res) => {
  const { tx_ref } = req.params;
  // Accept either `course_id` or `course` (return_url uses `course` currently)
  const course_id = req.query.course_id || req.query.course;

  console.log('Verify Payment - Incoming tx_ref:', tx_ref);
  console.log('Verify Payment - Incoming course_id:', course_id);

  if (!tx_ref) {
    return res.status(400).json({ error: 'Transaction reference (tx_ref) is required' });
  }
  if (!course_id) {
    return res.status(400).json({ error: 'Course ID is required' });
  }

  try {
    const chapaResponse = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(tx_ref)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
        timeout: 10000,
      }
    );

    const chapaData = chapaResponse.data;
    console.log('Verify Payment - Chapa Verification Response:', chapaData);

    if (chapaData.status !== 'success' || chapaData.data?.status !== 'success') {
      console.error('Verify Payment - Chapa payment verification failed:', chapaData);
      return res.status(400).json({ error: 'Payment not successful', details: chapaData });
    }

    // Find existing payment record
    const existingPayment = await Payment.findOne({ tx_ref: tx_ref.trim() });
    if (!existingPayment) {
      console.error('Verify Payment - No payment found in DB for tx_ref:', tx_ref);
      const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5);
      console.log('Verify Payment - Recent Payment Records:', recentPayments);
      return res.status(404).json({ error: 'Payment record not found in database' });
    }

    // Update payment record with verified state
    const updatedPayment = await Payment.findOneAndUpdate(
      { tx_ref: tx_ref.trim() },
      {
        status: 'success',
        courseId: course_id,
        verifiedAt: new Date(),
        chapaData: chapaData,
      },
      { new: true }
    );

    // Ensure course & instructor exist
    const course = await Course.findById(course_id);
    if (!course) {
      console.error('Verify Payment - Course not found for courseId:', course_id);
      return res.status(404).json({ error: 'Course not found' });
    }
    const instructorId = course.instructor;
    if (!instructorId) {
      console.error('Verify Payment - Instructor not found for course:', course_id);
      return res.status(404).json({ error: 'Instructor not found for the course' });
    }

    // Create transaction if missing
    const instructorShare = Number(existingPayment.amount) * 0.8;
    const platformShare = Number(existingPayment.amount) * 0.2;
    const existingTx = await Transaction.findOne({ paymentId: updatedPayment._id });

    if (!existingTx) {
      await Transaction.create({
        studentId: existingPayment.studentId,
        courseId: course_id,
        instructorId,
        paymentId: updatedPayment._id,
        amountPaid: existingPayment.amount,
        instructorShare,
        platformShare,
        status: 'completed',
      });

      // Update instructor balance
      await User.findByIdAndUpdate(instructorId, { $inc: { availableBalance: instructorShare } });
      console.log('Verify Payment - Instructor balance updated for instructorId:', instructorId);
    } else {
      console.log('Verify Payment - Transaction already exists for paymentId:', updatedPayment._id);
    }

    // Create enrollment if not already present
    const alreadyEnrolled = await Enrollment.findOne({
      studentId: existingPayment.studentId,
      courseId: course_id,
    });

    if (!alreadyEnrolled) {
      await Enrollment.create({
        studentId: existingPayment.studentId,
        courseId: course_id,
        paymentId: updatedPayment._id,
      });
      console.log('Verify Payment - Enrollment created for studentId:', existingPayment.studentId);
    } else {
      console.log('Verify Payment - Student already enrolled for courseId:', course_id);
    }

    console.log('Verify Payment - Payment verified, transaction processed, and enrollment created.');

    return res.status(200).json({
      message: 'Payment verified, transaction processed, and user enrolled successfully',
      payment: updatedPayment,
      courseId: course_id,
    });
  } catch (error) {
    console.error('Verify Payment - Error:', error.message, error.stack);
    return res.status(500).json({
      error: 'Payment verification failed',
      details: error.response?.data || error.message,
    });
  }
};

/* ============================
   GENERATE RECEIPT (FULL)
   Exports a PDF to the response.
   Uses drawConsolidatedTable helper above.
   ============================ */
export const generateReceipt = async (req, res) => {
  try {
    const { tx_ref } = req.params;

    if (!tx_ref) {
      return res.status(400).json({
        success: false,
        error: 'Transaction reference is required',
      });
    }

    const payment = await Payment.findOne({ tx_ref })
      .populate('studentId', 'name email phone')
      .populate('courseId', 'title description price instructor duration');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found',
      });
    }

    // Generate QR code (verification link)
    let qrCodeImage;
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-payment/${tx_ref}`;
      qrCodeImage = await QRCode.toDataURL(verificationUrl);
    } catch (qrError) {
      console.warn('QR code generation failed:', qrError);
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Payment Receipt - ${tx_ref}`,
        Author: 'Abugida',
      },
    });

    doc.on('error', (err) => {
      console.error('PDF stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error generating PDF',
        });
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Payment-Receipt-${tx_ref}.pdf`);
    doc.pipe(res);

    // Header: try logo from client assets, then backend assets, else text
    let headerY = 40;
    try {
      const clientLogoPath = path.join(__dirname, '../../../client/src/assets/logo.png');
      doc.image(clientLogoPath, 50, headerY, { width: 80 });
      doc.fontSize(20).fillColor('#2C3E50').text('PAYMENT RECEIPT', 150, headerY + 20);
    } catch (e1) {
      try {
        const backendLogoPath = path.join(__dirname, '../../utils/assets/logo.png');
        doc.image(backendLogoPath, 50, headerY, { width: 80 });
        doc.fontSize(20).fillColor('#2C3E50').text('PAYMENT RECEIPT', 150, headerY + 20);
      } catch (e2) {
        doc.fontSize(24).fillColor('#2C3E50').text('Abugida', 50, headerY);
        doc.fontSize(20).fillColor('#2C3E50').text('PAYMENT RECEIPT', 50, headerY + 30);
      }
    }

    doc.fontSize(10).fillColor('#7f8c8d').text('OFFICIAL PAYMENT RECEIPT', 50, 90);

    doc.moveTo(50, 105).lineTo(550, 105).stroke('#e0e0e0').lineWidth(1);

    // Table sections
    const tableSections = [
      {
        title: 'Payment Information',
        rows: [
          { label: 'Receipt Number', value: tx_ref },
          { label: 'Date', value: new Date(payment.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
          { label: 'Amount Paid', value: `${Number(payment.amount).toLocaleString()} ETB`, highlight: true },
          { label: 'Payment Method', value: payment.chapaData?.data?.method || 'Online Payment' },
          { label: 'Status', value: (payment.status || 'PENDING').toUpperCase() },
        ],
      },
      {
        title: 'Student Information',
        rows: [
          { label: 'Full Name', value: payment.studentId?.name || 'N/A' },
          { label: 'Email Address', value: payment.studentId?.email || 'N/A' },
          { label: 'Phone Number', value: payment.studentId?.phone || 'N/A' },
        ],
      },
      {
        title: 'Course Information',
        rows: [
          { label: 'Course Title', value: payment.courseId?.title || 'N/A' },
          { label: 'Instructor', value: String(payment.courseId?.instructor || 'N/A') },
          { label: 'Duration', value: payment.courseId?.duration || 'N/A' },
          { label: 'Course Price', value: `${payment.courseId?.price ? Number(payment.courseId.price).toLocaleString() : '0'} ETB` },
        ],
      },
    ];

    let currentY = drawConsolidatedTable(doc, tableSections, 50, 130);

    // QR Code (if available)
    if (qrCodeImage && currentY < 650) {
      try {
        // QR image is a data URL; pdfkit accepts buffer - convert base64
        const base64Data = qrCodeImage.split(',')[1];
        const imgBuffer = Buffer.from(base64Data, 'base64');
        doc.image(imgBuffer, 400, currentY, { width: 100 });
        doc.fontSize(10).fillColor('#7f8c8d')
          .text('Scan to verify payment', 400, currentY + 110, { width: 100, align: 'center' });
        currentY += 130;
      } catch (err) {
        console.warn('Failed to attach QR image to PDF:', err);
      }
    }

    // Footer
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke('#e0e0e0').lineWidth(1);
    doc.fontSize(10).fillColor('#7f8c8d')
      .text('Thank you for your payment!', 50, currentY + 20)
      .text('For inquiries, contact support@abugida.com', 50, currentY + 35)
      .text(`Generated on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 50, currentY + 50);

    doc.end();
  } catch (error) {
    console.error('Receipt generation failed:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Internal server error while generating receipt',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
};
