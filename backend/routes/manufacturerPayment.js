import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import Settlement from '../models/Settlement.js';
import Bank from '../models/Bank.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/manufacturer/payment/summary
router.get('/summary', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const summary = {
      totalEarned: 15540.50,
      totalEarnedChange: 12.5,
      pendingPayout: 450.00,
      nextSettlementDate: "2024-03-12",
      netRevenue: 10722.94,
      platformFees: 1234.56,
      taxDeducted: 3583.00
    };
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/manufacturer/payment/earnings
router.get('/earnings', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const period = req.query.period || '6months';
    const monthlyData = [
      { month: "Apr", year: 2024, amount: 4800.00 },
      { month: "May", year: 2024, amount: 7200.00 },
      { month: "Jun", year: 2024, amount: 10500.00 },
      { month: "Jul", year: 2024, amount: 8900.00 },
      { month: "Aug", year: 2024, amount: 16000.00 },
      { month: "Sep", year: 2024, amount: 15540.00 }
    ];

    res.json({
      period,
      totalEarnings: 15540.50,
      changePercentage: 12.5,
      monthlyData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/manufacturer/payment/settlement/active
router.get('/settlement/active', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const active = {
      settlementId: "STL-942-X",
      status: "PROCESSING",
      amount: 450.00,
      expectedDate: "2024-03-12",
      bankName: "Chase Bank",
      accountLast4: "4820",
      payoutMethod: "AUTOMATED"
    };
    res.json(active);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/manufacturer/payment/transactions
router.get('/transactions', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, search } = req.query;
    
    // Mocking transaction data for Phase 4
    const allTransactions = [
      { id: uuidv4().slice(0,8).toUpperCase(), date: '2024-03-01', transactionId: 'TRX-8291-LL', type: 'Order Payment', orderId: '#ORD-9921', amount: 12450.00, status: 'COMPLETED' },
      { id: uuidv4().slice(0,8).toUpperCase(), date: '2024-03-02', transactionId: 'TRX-8292-MM', type: 'Platform Fee', orderId: '#ORD-9921', amount: -1245.00, status: 'COMPLETED' },
      { id: uuidv4().slice(0,8).toUpperCase(), date: '2024-03-03', transactionId: 'TRX-8293-NN', type: 'Payout', orderId: 'N/A', amount: -5000.00, status: 'COMPLETED' },
      { id: uuidv4().slice(0,8).toUpperCase(), date: '2024-03-04', transactionId: 'TRX-8294-OO', type: 'Refund', orderId: '#ORD-9812', amount: -650.00, status: 'FAILED' },
      { id: uuidv4().slice(0,8).toUpperCase(), date: '2024-03-05', transactionId: 'TRX-8295-PP', type: 'Order Payment', orderId: '#ORD-9955', amount: 2100.00, status: 'PENDING' },
      { id: uuidv4().slice(0,8).toUpperCase(), date: '2024-03-06', transactionId: 'TRX-8296-QQ', type: 'Order Payment', orderId: '#ORD-9960', amount: 450.00, status: 'COMPLETED' },
      { id: uuidv4().slice(0,8).toUpperCase(), date: '2024-03-07', transactionId: 'TRX-8297-RR', type: 'Platform Fee', orderId: '#ORD-9960', amount: -45.00, status: 'COMPLETED' },
      { id: uuidv4().slice(0,8).toUpperCase(), date: '2024-03-08', transactionId: 'TRX-8298-SS', type: 'Payout', orderId: 'N/A', amount: -450.00, status: 'PENDING' },
    ];

    let filtered = allTransactions;
    if (type) filtered = filtered.filter(t => t.type === type);
    if (status) filtered = filtered.filter(t => t.status === status);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(t => t.transactionId.toLowerCase().includes(s) || t.orderId.toLowerCase().includes(s));
    }

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      total: filtered.length,
      page: parseInt(page),
      limit: parseInt(limit),
      data: paginated
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// BANK MANAGEMENT
router.get('/banks', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const banks = await Bank.find({ manufacturer: req.user._id });
    res.json(banks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/banks', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { accountName, accountNumber, ifscCode, bankName, isPrimary } = req.body;
    
    // If setting as primary, unset others
    if (isPrimary) {
      await Bank.updateMany({ manufacturer: req.user._id }, { isPrimary: false });
    }

    const bank = await Bank.create({
      manufacturer: req.user._id,
      accountName,
      accountNumber,
      ifscCode,
      bankName,
      isPrimary
    });
    res.status(201).json(bank);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/banks/:id', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const bank = await Bank.findOneAndDelete({ _id: req.params.id, manufacturer: req.user._id });
    if (!bank) return res.status(404).json({ message: 'Bank not found' });
    res.json({ message: 'Bank removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADVANCED REPORT GENERATION
router.post('/report/generate', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { type, period, format } = req.body;
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Report');
      sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Order ID', key: 'orderId', width: 15 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
      ];
      
      // Mock data for Excel
      sheet.addRow({ date: '2024-03-01', type: 'Order Payment', orderId: '#ORD-9921', amount: 12450.00, status: 'COMPLETED' });
      sheet.addRow({ date: '2024-03-02', type: 'Platform Fee', orderId: '#ORD-9921', amount: -1245.00, status: 'COMPLETED' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xlsx"`);
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Default to PDF (previous logic expanded)
      const doc = new PDFDocument();
      res.setHeader('Content-disposition', `attachment; filename="${type}-report.pdf"`);
      res.setHeader('Content-type', 'application/pdf');
      
      doc.pipe(res);
      doc.fontSize(20).text(`${type} Details`, 100, 100);
      doc.fontSize(12).text(`Period: ${period}`, 100, 140);
      doc.text(`Generated for: ${req.user.company}`, 100, 160);
      doc.moveDown();
      doc.text('--- Mock Transaction Summary ---');
      doc.text('1. #ORD-9921 | Rs. 12,450.00 | COMPLETED');
      doc.text('2. Platform Fee | Rs. -1,245.00 | COMPLETED');
      doc.end();
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/withdraw', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { amount, bankId } = req.body;
    if (!amount) return res.status(400).json({ message: 'Amount is required' });

    res.json({
      success: true,
      settlementId: `STL-${Math.floor(Math.random() * 1000)}-X`,
      amount,
      bankId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy generic report for backward compatibility
router.get('/report', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const doc = new PDFDocument();
    res.setHeader('Content-disposition', 'attachment; filename="settlement-report.pdf"');
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);
    doc.fontSize(25).text('Manufacturer Payment Report', 100, 100);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
