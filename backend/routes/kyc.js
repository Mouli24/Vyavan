import { Router } from 'express';
import { protect } from '../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/kyc/gst
 * @desc    Simulate GST verification and PAN name matching
 * @access  Private (Manufacturer)
 */
router.post('/gst', protect, async (req, res) => {
  try {
    const { gstNumber, panNumber } = req.body;

    if (!gstNumber || gstNumber.length !== 15) {
      return res.status(400).json({ message: 'Invalid GST number format.' });
    }

    // Simulate Network Latency
    await new Promise(r => setTimeout(r, 1200));

    // Mock Business Logic:
    // GST format check (Simple Regex for 15 digits/chars)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNumber)) {
      return res.status(400).json({ message: 'Fake or Invalid GST format. Please enter a real GSTIN.' });
    }

    // Mock PAN check
    if (panNumber && !gstNumber.includes(panNumber)) {
      return res.status(400).json({ message: 'PAN number does not match the GST registration. Please verify details.' });
    }

    // Success response with mock legal name
    res.json({
      success: true,
      legalName: 'Sephio Manufacturing Solutions Pvt Ltd',
      gstStatus: 'Active',
      registrationDate: '2022-05-15',
      address: 'Plot 45, Industrial Area Phase II, Mumbai, MH'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route   POST /api/kyc/bank-verify
 * @desc    Simulate Penny Drop verification (₹1)
 * @access  Private (Manufacturer)
 */
router.post('/bank-verify', protect, async (req, res) => {
  try {
    const { accountNumber, ifscCode, accountName } = req.body;

    if (!accountNumber || !ifscCode || !accountName) {
      return res.status(400).json({ message: 'Missing bank details for verification.' });
    }

    // Simulate Penny Drop Logic (Security Check)
    await new Promise(r => setTimeout(r, 2000));

    // Mock validation: In a real app, we'd hit Cashfree/Razorpay API here.
    // Let's mock a failure if accountNumber is just '123' or '0000'
    if (accountNumber === '123' || accountNumber === '0000000000') {
      return res.status(400).json({ message: 'Bank account verification failed. Invalid account.' });
    }

    res.json({
      success: true,
      message: 'Penny Drop successful! Account verified.',
      bankResponse: {
        registeredName: accountName,
        status: 'SUCCESS',
        utr: 'UTR' + Date.now().toString().slice(-10)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
