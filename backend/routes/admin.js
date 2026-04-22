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
    const now = new Date();
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const startOf7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastHour     = new Date(Date.now() - 60 * 60 * 1000);

    const [
      mfrStats,
      buyerStats,
      orderStats,
      gmvMonthAgg,
      disputesCount,
      registrationsToday,
      ordersLastHour,
      flagsToday,
    ] = await Promise.all([
      // Manufacturers status breakdown
      User.aggregate([
        { $match: { role: 'manufacturer' } },
        { $group: { _id: '$manufacturerStatus', count: { $sum: 1 } } }
      ]),
      // Buyers status breakdown
      User.aggregate([
        { $match: { role: 'buyer' } },
        { 
          $group: { 
            _id: null, 
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$isVerified', false] }, 1, 0] } },
          } 
        }
      ]),
      // Orders counts by time
      Promise.all([
        Order.countDocuments({ createdAt: { $gte: startOfToday } }),
        Order.countDocuments({ createdAt: { $gte: startOf7Days } }),
        Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      ]),
      // GMV this month
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$valueRaw' } } }
      ]),
      // Disputes (Open)
      Complaint.countDocuments({ status: { $in: ['PENDING', 'ESCALATED'] } }),
      // LIVE FEED: Registrations Today
      User.find({ createdAt: { $gte: startOfToday } })
        .select('name role company createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      // LIVE FEED: Orders last 1 hour
      Order.find({ createdAt: { $gte: lastHour } })
        .populate('buyer.ref', 'name')
        .select('orderId value createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      // LIVE FEED: Flags (Escalated Complaints)
      Complaint.find({ status: 'ESCALATED', updatedAt: { $gte: startOfToday } })
        .select('title company status updatedAt')
        .sort({ updatedAt: -1 })
        .limit(5),
    ]);

    // Format Manufacturer stats
    const mfrs = { total: 0, pending: 0, approved: 0, suspended: 0 };
    mfrStats.forEach(s => {
      mfrs.total += s.count;
      if (s._id === 'pending') mfrs.pending = s.count;
      if (s._id === 'approved') mfrs.approved = s.count;
      if (s._id === 'suspended') mfrs.suspended = s.count;
    });

    const gmvMonth = gmvMonthAgg[0]?.total ?? 0;
    const commission = Math.floor(gmvMonth * 0.05); // 5% flat

    res.json({
      manufacturers: mfrs,
      buyers: buyerStats[0] || { total: 0, active: 0, pending: 0, flagged: 0 },
      orders: {
        today: orderStats[0],
        week: orderStats[1],
        month: orderStats[2]
      },
      gmvMonth,
      commission,
      disputes: disputesCount,
      verifications: mfrs.pending,
      alerts: disputesCount, // Suspicious = Open disputes/escalations
      liveFeed: {
        registrations: registrationsToday,
        orders: ordersLastHour,
        flags: flagsToday
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ── Manufacturers ──────────────────────────────────────────────────────────
router.get('/manufacturers', adminOnly, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20, name, city, state, plan, sector } = req.query;
    
    // User Filter
    const userFilter = { role: 'manufacturer' };
    if (status !== 'all') userFilter.manufacturerStatus = status;
    if (name) {
      userFilter.$or = [
        { name: { $regex: name, $options: 'i' } },
        { company: { $regex: name, $options: 'i' } },
        { email: { $regex: name, $options: 'i' } }
      ];
    }
    
    // Pre-filtering profiles based on params to optionally restrict users
    let profileQueryFilter = null;
    if (city || state || plan || sector) {
      profileQueryFilter = {};
      if (city) profileQueryFilter['address.city'] = { $regex: city, $options: 'i' };
      if (state) profileQueryFilter['address.state'] = { $regex: state, $options: 'i' };
      if (plan) profileQueryFilter.planType = plan;
      if (sector) profileQueryFilter.sector = { $regex: sector, $options: 'i' };
    }

    if (profileQueryFilter) {
      const matchingProfiles = await ManufacturerProfile.find(profileQueryFilter).select('user');
      const matchingUserIds = matchingProfiles.map(p => p.user);
      userFilter._id = { $in: matchingUserIds };
    }

    const [manufacturers, total] = await Promise.all([
      User.find(userFilter)
        .select('-password -loginHistory') // Omit sensitive logs on list fetch
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      User.countDocuments(userFilter),
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

    // Update profile status and generate activation code
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await ManufacturerProfile.findOneAndUpdate(
      { user: req.params.id },
      { 
        status: 'approved', 
        isVerified: true,
        isActivated: false,
        activationCode,
        approvedAt: new Date(), 
        approvedBy: req.user._id 
      },
    );

    // Send notification with code (Simulation of Email)
    await Notification.create({
      user: req.params.id,
      type: 'manufacturer_approved',
      title: 'Account Approved! Action Required',
      message: `Congratulations! Your account is approved. Use this Activation Code to unlock your dashboard: ${activationCode}`,
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

// ── Request More Documents ──────────────────────────────────────────────────
router.patch('/manufacturers/:id/request-docs', adminOnly, async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ message: 'Note is required' });

    const profile = await ManufacturerProfile.findOneAndUpdate(
      { user: req.params.id },
      { 
        verificationNote: note,
        status: 'pending' // stays pending but with a note
      },
      { new: true }
    );

    if (!profile) return res.status(404).json({ message: 'Manufacturer not found' });

    await Notification.create({
      user: req.params.id,
      type: 'action_required',
      title: 'Additional Documents Requested',
      message: `Admin has requested updates: ${note}`,
      link: '/manufacturer/onboarding',
    });

    res.json({ message: 'Request sent', profile });
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

// ── Manufacturer Profile Detail Aggregation ─────────────────────────────────
router.get('/manufacturers/:id/profile', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'manufacturer') {
      return res.status(404).json({ message: 'Manufacturer not found' });
    }

    const [profile, productsCount, orders] = await Promise.all([
      ManufacturerProfile.findOne({ user: req.params.id }),
      Product.countDocuments({ manufacturer: req.params.id }),
      Order.find({ manufacturer: req.params.id }).select('valueRaw status')
    ]);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.valueRaw : 0), 0);

    // Complaint rate calculation
    const complaints = await Complaint.countDocuments({ manufacturer: req.params.id });
    const complaintRate = totalOrders > 0 ? ((complaints / totalOrders) * 100).toFixed(1) : 0;

    res.json({
      user,
      profile,
      stats: {
        totalProducts: productsCount,
        totalOrders,
        totalRevenue,
        complaintRate,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Manufacturer -> Buyer Map ───────────────────────────────────────────────
router.get('/manufacturers/:id/buyers', adminOnly, async (req, res) => {
  try {
    const buyersAgg = await Order.aggregate([
      { $match: { manufacturer: new mongoose.Types.ObjectId(req.params.id), status: { $ne: 'Cancelled' } } },
      { 
        $group: { 
          _id: '$buyer.ref',
          orderCount: { $sum: 1 },
          totalValue: { $sum: '$valueRaw' },
          lastOrder: { $max: '$createdAt' }
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'buyerInfo'
        }
      },
      { $unwind: '$buyerInfo' },
      { 
        $project: {
          _id: 1,
          name: '$buyerInfo.name',
          company: '$buyerInfo.company',
          email: '$buyerInfo.email',
          orderCount: 1,
          totalValue: 1,
          lastOrder: 1
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    res.json({ buyers: buyersAgg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Change Manufacturer Plan ────────────────────────────────────────────────
router.patch('/manufacturers/:id/plan', adminOnly, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['Free', 'Basic', 'Premium'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }

    const profile = await ManufacturerProfile.findOneAndUpdate(
      { user: req.params.id },
      { planType: plan },
      { new: true }
    );

    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json({ message: 'Plan updated successfully', profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Force Password Reset ────────────────────────────────────────────────────
router.post('/manufacturers/:id/reset-password', adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { mustResetPassword: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Optional: Log out user globally if using session store or update JWT tracking
    // Send email notification for password reset

    res.json({ message: 'User flagged for password reset' });
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
