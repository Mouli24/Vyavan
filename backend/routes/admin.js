import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import ManufacturerProfile from '../models/ManufacturerProfile.js';
import Order from '../models/Order.js';
import Complaint from '../models/Complaint.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';

const router = Router();
const adminOnly = [protect, requireRole('admin')];

// ── Dashboard Stats ────────────────────────────────────────────────────────
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const [
      totalManufacturers,
      pendingManufacturers,
      approvedManufacturers,
      totalBuyers,
      totalOrders,
      pendingComplaints,
      totalProducts,
    ] = await Promise.all([
      User.countDocuments({ role: 'manufacturer' }),
      User.countDocuments({ role: 'manufacturer', manufacturerStatus: 'pending' }),
      User.countDocuments({ role: 'manufacturer', manufacturerStatus: 'approved' }),
      User.countDocuments({ role: 'buyer' }),
      Order.countDocuments({}),
      Complaint.countDocuments({ status: { $in: ['PENDING', 'ESCALATED'] } }),
      Product.countDocuments({ isActive: true }),
    ]);

    // Revenue (sum of all order values)
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$valueRaw' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total ?? 0;

    // Monthly order stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$valueRaw' },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalManufacturers,
      pendingManufacturers,
      approvedManufacturers,
      totalBuyers,
      totalOrders,
      pendingComplaints,
      totalProducts,
      totalRevenue,
      monthlyOrders,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Manufacturers ──────────────────────────────────────────────────────────
router.get('/manufacturers', adminOnly, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const filter = { role: 'manufacturer' };
    if (status !== 'all') filter.manufacturerStatus = status;

    const [manufacturers, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      User.countDocuments(filter),
    ]);

    // Get profiles for each manufacturer
    const ids = manufacturers.map(m => m._id);
    const profiles = await ManufacturerProfile.find({ user: { $in: ids } });
    const profileMap = Object.fromEntries(profiles.map(p => [p.user.toString(), p]));

    const data = manufacturers.map(m => ({
      ...m.toJSON(),
      profile: profileMap[m._id.toString()] ?? null,
    }));

    res.json({ data, total, page: +page, limit: +limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Approve Manufacturer ────────────────────────────────────────────────────
router.patch('/manufacturers/:id/approve', adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { manufacturerStatus: 'approved' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Manufacturer not found' });

    // Update profile status too
    await ManufacturerProfile.findOneAndUpdate(
      { user: req.params.id },
      { status: 'approved', approvedAt: new Date(), approvedBy: req.user._id },
    );

    // Send notification
    await Notification.create({
      user: req.params.id,
      type: 'manufacturer_approved',
      title: 'Account Approved!',
      message: 'Congratulations! Your manufacturer account has been approved. You can now start listing products.',
      link: '/manufacturer/overview',
    });

    res.json({ message: 'Manufacturer approved', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Reject Manufacturer ─────────────────────────────────────────────────────
router.patch('/manufacturers/:id/reject', adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { manufacturerStatus: 'rejected' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Manufacturer not found' });

    await ManufacturerProfile.findOneAndUpdate(
      { user: req.params.id },
      { status: 'rejected', rejectionReason: reason },
    );

    await Notification.create({
      user: req.params.id,
      type: 'manufacturer_rejected',
      title: 'Account Review Update',
      message: reason ? `Your account was not approved: ${reason}` : 'Your account application was not approved. Please contact support.',
      link: '/manufacturer/onboarding',
    });

    res.json({ message: 'Manufacturer rejected', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Suspend Manufacturer ────────────────────────────────────────────────────
router.patch('/manufacturers/:id/suspend', adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { manufacturerStatus: 'suspended', isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Manufacturer not found' });
    res.json({ message: 'Manufacturer suspended', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buyers ─────────────────────────────────────────────────────────────────
router.get('/buyers', adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [buyers, total] = await Promise.all([
      User.find({ role: 'buyer' })
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      User.countDocuments({ role: 'buyer' }),
    ]);
    res.json({ data: buyers, total, page: +page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── All Orders ─────────────────────────────────────────────────────────────
router.get('/orders', adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('manufacturer', 'name company email')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Order.countDocuments(filter),
    ]);
    res.json({ data: orders, total, page: +page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── All Complaints ─────────────────────────────────────────────────────────
router.get('/complaints', adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('buyer', 'name email company')
        .populate('manufacturer', 'name email company')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Complaint.countDocuments(filter),
    ]);
    res.json({ data: complaints, total, page: +page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Resolve Complaint ──────────────────────────────────────────────────────
router.patch('/complaints/:id/resolve', adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: status ?? 'RESOLVED', resolution: { note: adminNote } },
      { new: true }
    ).populate('buyer manufacturer', 'name email');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Notify buyer
    if (complaint.buyer) {
      await Notification.create({
        user: complaint.buyer._id,
        type: 'complaint_resolved',
        title: 'Complaint Update',
        message: `Your complaint "${complaint.title}" has been ${status?.toLowerCase() ?? 'resolved'} by admin.`,
        link: '/buyer/complaints',
        refModel: 'Complaint',
        refId: complaint._id,
      });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Platform Analytics (extended) ──────────────────────────────────────────
router.get('/analytics', adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const last30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const last7  = new Date(now - 7  * 24 * 60 * 60 * 1000);

    const [newManufacturers30, newBuyers30, orders30, topProducts] = await Promise.all([
      User.countDocuments({ role: 'manufacturer', createdAt: { $gte: last30 } }),
      User.countDocuments({ role: 'buyer', createdAt: { $gte: last30 } }),
      Order.find({ createdAt: { $gte: last30 } }).select('valueRaw status createdAt'),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
    ]);

    const ordersRevenue = orders30.reduce((sum, o) => sum + (o.valueRaw ?? 0), 0);

    res.json({
      newManufacturers30,
      newBuyers30,
      ordersLast30: orders30.length,
      revenueLast30: ordersRevenue,
      topCategories: topProducts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
