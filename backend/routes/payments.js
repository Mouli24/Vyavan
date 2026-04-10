import { Router } from 'express';
import Settlement from '../models/Settlement.js';
import Order from '../models/Order.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/payments/summary  — totals for the payment page cards
router.get('/summary', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const settlements = await Settlement.find({ manufacturer: req.user._id });

    const totalEarned = settlements
      .filter(s => s.status === 'COMPLETED')
      .reduce((acc, s) => acc + s.amountRaw, 0);

    const pending = settlements
      .filter(s => s.status === 'PENDING' || s.status === 'HELD')
      .reduce((acc, s) => acc + s.amountRaw, 0);

    // Net = totalEarned after a mock 31% tax+fees
    const netRevenue = totalEarned * 0.69;

    res.json({
      totalEarned: `$${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      pendingPayout: `$${pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      netRevenue: `$${netRevenue.toFixed(2)}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/settlements  — recent settlement list
router.get('/settlements', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const settlements = await Settlement.find({ manufacturer: req.user._id })
      .populate('order', 'orderId')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/earnings  — monthly earnings for chart (last 6 months)
router.get('/earnings', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const settlements = await Settlement.find({
      manufacturer: req.user._id,
      status: 'COMPLETED',
    });

    // Group by month
    const byMonth = {};
    for (const s of settlements) {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] ?? 0) + s.amountRaw;
    }

    const months = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, value]) => {
        const [year, month] = key.split('-');
        const label = new Date(Number(year), Number(month) - 1).toLocaleString('en-US', { month: 'short' });
        return { month: label, revenue: value };
      });

    res.json(months);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
