import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import ManufacturerProfile from '../models/ManufacturerProfile.js';
import BuyerProfile from '../models/BuyerProfile.js';
import UserActivity from '../models/UserActivity.js';
import Order from '../models/Order.js';
import Complaint from '../models/Complaint.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import PartnerRelationship from '../models/PartnerRelationship.js';
import SystemFlag from '../models/SystemFlag.js';
import PricingPlan from '../models/PricingPlan.js';
import Broadcast from '../models/Broadcast.js';
import EmailTemplate from '../models/EmailTemplate.js';
import Cart from '../models/Cart.js';
import { runFraudDetection } from '../lib/fraudDetector.js';
import mongoose from 'mongoose';

const router = Router();
const adminOnly = [protect, requireRole('admin')];

// ── Dashboard Stats ────────────────────────────────────────────────────────
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const startOf7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const lastHour     = new Date(Date.now() - 60 * 60 * 1000);

    const [
      mfrStats,
      buyerStats,
      orderStats,
      gmvMonthAgg,
      gmvLastMonthAgg,
      disputesCount,
      flaggedBuyersCount,
      registrationsToday,
      ordersLastHour,
      ordersLastHourCount,
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
            flagged: { $sum: { $cond: [{ $eq: ['$isFlagged', true] }, 1, 0] } },
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
      // GMV last month (for percentage comparison)
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$valueRaw' } } }
      ]),
      // Disputes (Open)
      Complaint.countDocuments({ status: { $in: ['PENDING', 'ESCALATED'] } }),
      // Flagged buyers count (suspicious activity related users)
      User.countDocuments({ role: 'buyer', isFlagged: true }),
      // LIVE FEED: Registrations Today
      User.find({ createdAt: { $gte: startOfToday } })
        .select('name role company createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
      // LIVE FEED: Orders last 1 hour (list)
      Order.find({ createdAt: { $gte: lastHour } })
        .populate('buyer.ref', 'name')
        .select('orderId value createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      // LIVE FEED: Orders last 1 hour (counter)
      Order.countDocuments({ createdAt: { $gte: lastHour } }),
      // LIVE FEED: Flags (Escalated Complaints)
      Complaint.find({ status: 'ESCALATED', updatedAt: { $gte: startOfToday } })
        .select('title company status updatedAt')
        .sort({ updatedAt: -1 })
        .limit(10),
    ]);

    // Format Manufacturer stats
    const mfrs = { total: 0, pending: 0, approved: 0, suspended: 0 };
    mfrStats.forEach(s => {
      mfrs.total += s.count;
      if (s._id === 'pending') mfrs.pending = s.count;
      if (s._id === 'approved') mfrs.approved = s.count;
      if (s._id === 'suspended') mfrs.suspended = s.count;
    });

    const buyers = buyerStats[0] || { total: 0, active: 0, pending: 0, flagged: 0 };
    // Override flagged with actual count if the field doesnt exist on user model
    buyers.flagged = buyers.flagged || flaggedBuyersCount || 0;

    const gmvMonth = gmvMonthAgg[0]?.total ?? 0;
    const gmvLastMonth = gmvLastMonthAgg[0]?.total ?? 0;
    const commission = Math.floor(gmvMonth * 0.05); // 5% flat

    // GMV month-over-month percentage change
    let gmvChange = 0;
    if (gmvLastMonth > 0) {
      gmvChange = parseFloat((((gmvMonth - gmvLastMonth) / gmvLastMonth) * 100).toFixed(1));
    } else if (gmvMonth > 0) {
      gmvChange = 100;
    }

    // Combined pending verifications (mfr + buyer)
    const combinedVerifications = mfrs.pending + (buyers.pending || 0);

    res.json({
      manufacturers: mfrs,
      buyers,
      orders: {
        today: orderStats[0],
        week: orderStats[1],
        month: orderStats[2]
      },
      gmvMonth,
      gmvLastMonth,
      gmvChange,
      commission,
      disputes: disputesCount,
      verifications: combinedVerifications,
      alerts: disputesCount, // Suspicious = Open disputes/escalations
      liveFeed: {
        registrations: registrationsToday,
        orders: ordersLastHour,
        ordersLastHourCount,
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
    const { 
      status = 'all', 
      page = 1, 
      limit = 20, 
      name, 
      city, 
      state, 
      plan, 
      sector,
      sortBy = 'newest' // newest, revenue, rating
    } = req.query;
    
    // Build Aggregation Pipeline
    const pipeline = [
      { $match: { role: 'manufacturer' } }
    ];

    if (status !== 'all') {
      pipeline.push({ $match: { manufacturerStatus: status } });
    }

    if (name) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: name, $options: 'i' } },
            { company: { $regex: name, $options: 'i' } },
            { email: { $regex: name, $options: 'i' } }
          ]
        }
      });
    }

    // Lookup profile for additional filters and sorting
    pipeline.push({
      $lookup: {
        from: 'manufacturerprofiles',
        localField: '_id',
        foreignField: 'user',
        as: 'profile'
      }
    });

    pipeline.push({ $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } });

    // Apply Profile Filters
    if (city || state || plan || sector) {
      const profileFilter = {};
      if (city) profileFilter['profile.address.city'] = { $regex: city, $options: 'i' };
      if (state) profileFilter['profile.address.state'] = { $regex: state, $options: 'i' };
      if (plan) profileFilter['profile.planType'] = plan;
      if (sector) profileFilter['profile.sector'] = { $regex: sector, $options: 'i' };
      pipeline.push({ $match: profileFilter });
    }

    // Sorting Logic
    if (sortBy === 'revenue') {
      pipeline.push({ $sort: { 'profile.stats.totalRevenue': -1, createdAt: -1 } });
    } else if (sortBy === 'rating') {
      pipeline.push({ $sort: { 'profile.stats.avgRating': -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Pagination
    const totalPipeline = [...pipeline, { $count: 'total' }];
    pipeline.push({ $skip: (+page - 1) * +limit });
    pipeline.push({ $limit: +limit });

    const [data, totalCount] = await Promise.all([
      User.aggregate(pipeline),
      User.aggregate(totalPipeline)
    ]);

    res.json({ 
      data, 
      total: totalCount[0]?.total || 0, 
      page: +page, 
      limit: +limit 
    });
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

    // Find and update profile to trigger pre('save') hooks for companyCode
    let profile = await ManufacturerProfile.findOne({ user: req.params.id });
    if (!profile) {
      profile = new ManufacturerProfile({ user: req.params.id });
    }

    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    profile.status = 'approved';
    profile.isVerified = true;
    profile.isActivated = false;
    profile.activationCode = activationCode;
    profile.approvedAt = new Date();
    profile.approvedBy = req.user._id;

    await profile.save(); // Triggers pre('save') hook for companyCode if missing

    // Send notification with code (Simulation of Email)
    await Notification.create({
      user: req.params.id,
      type: 'manufacturer_approved',
      title: 'Account Approved! Action Required',
      message: `Congratulations! Your account is approved. Store ID: ${profile.companyCode}. Activation Code: ${activationCode}`,
      link: '/manufacturer/overview',
    });

    res.json({ 
      message: 'Manufacturer approved', 
      user, 
      companyCode: profile.companyCode, 
      activationCode 
    });
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
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user || user.role !== 'manufacturer') {
      return res.status(404).json({ message: 'Manufacturer not found' });
    }

    const [profile, productsCount, orders, subUsers] = await Promise.all([
      ManufacturerProfile.findOne({ user: req.params.id }),
      Product.countDocuments({ manufacturer: req.params.id }),
      Order.find({ manufacturer: req.params.id }).select('valueRaw status'),
      User.find({ parentPartner: req.params.id }).select('name email role isActive lastLogin')
    ]);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.valueRaw : 0), 0);

    // Complaint rate calculation
    const complaints = await Complaint.countDocuments({ manufacturer: req.params.id });
    const complaintRate = totalOrders > 0 ? ((complaints / totalOrders) * 100).toFixed(1) : 0;

    res.json({
      user,
      profile,
      subUsers,
      stats: {
        totalProducts: productsCount,
        totalOrders,
        totalRevenue,
        complaintRate,
        avgRating: profile?.stats?.avgRating || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Manufacturer -> Buyer Map ───────────────────────────────────────────────
router.get('/manufacturers/:id/buyers', adminOnly, async (req, res) => {
  try {
    const mId = new mongoose.Types.ObjectId(req.params.id);
    
    // Aggregate orders to get buyer list
    const buyersAgg = await Order.aggregate([
      { $match: { manufacturer: mId, status: { $ne: 'Cancelled' } } },
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
        $lookup: {
          from: 'partnerrelationships',
          let: { bId: '$_id', mId: mId },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ['$buyer', '$$bId'] }, { $eq: ['$manufacturer', '$$mId'] } ] } } }
          ],
          as: 'rel'
        }
      },
      { $unwind: { path: '$rel', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'complaints',
          let: { bId: '$_id', mId: mId },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ['$buyer', '$$bId'] }, { $eq: ['$manufacturer', '$$mId'] } ] } } }
          ],
          as: 'allComplaints'
        }
      },
      { 
        $project: {
          _id: 1,
          name: '$buyerInfo.name',
          company: '$buyerInfo.company',
          email: '$buyerInfo.email',
          orderCount: 1,
          totalValue: 1,
          lastOrder: 1,
          isSuspicious: { $ifNull: ['$rel.isSuspicious', false] },
          disputeCount: { $size: '$allComplaints' }
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

// ── Flag Relationship as Suspicious ──────────────────────────────────────────
router.patch('/relationships/flag', adminOnly, async (req, res) => {
  try {
    const { manufacturerId, buyerId, isSuspicious, reason } = req.body;
    
    const rel = await PartnerRelationship.findOneAndUpdate(
      { manufacturer: manufacturerId, buyer: buyerId },
      { 
        isSuspicious, 
        suspicionReason: isSuspicious ? reason : undefined,
        flaggedAt: isSuspicious ? new Date() : undefined,
        flaggedBy: isSuspicious ? req.user._id : undefined
      },
      { upsert: true, new: true }
    );

    res.json({ message: `Relationship ${isSuspicious ? 'flagged' : 'unflagged'}`, rel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Revoke Sub-user Access ───────────────────────────────────────────────────
router.patch('/sub-users/:id/revoke', adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Sub-user not found' });
    res.json({ message: 'Access revoked', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buyers ─────────────────────────────────────────────────────────────────
router.get('/buyers', adminOnly, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'all', 
      search, 
      city, 
      state, 
      type,
      sortBy = 'newest' // newest, spent, orders
    } = req.query;

    const pipeline = [{ $match: { role: 'buyer' } }];

    if (status !== 'all') {
      pipeline.push({ $match: { isVerified: status === 'approved' } });
    }

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    pipeline.push({
      $lookup: {
        from: 'buyerprofiles',
        localField: '_id',
        foreignField: 'user',
        as: 'profile'
      }
    });
    pipeline.push({ $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } });

    if (city || state || type) {
      const pFilter = {};
      if (city) pFilter['addresses.city'] = { $regex: city, $options: 'i' };
      if (state) pFilter['addresses.state'] = { $regex: state, $options: 'i' };
      if (type) pFilter['profile.businessType'] = type;
      pipeline.push({ $match: pFilter });
    }

    // Sort
    if (sortBy === 'spent') pipeline.push({ $sort: { 'profile.stats.totalSpent': -1, createdAt: -1 } });
    else if (sortBy === 'orders') pipeline.push({ $sort: { 'profile.stats.orderCount': -1, createdAt: -1 } });
    else pipeline.push({ $sort: { createdAt: -1 } });

    const totalPipeline = [...pipeline, { $count: 'total' }];
    pipeline.push({ $skip: (+page - 1) * +limit });
    pipeline.push({ $limit: +limit });

    const [data, totalCount] = await Promise.all([
      User.aggregate(pipeline),
      User.aggregate(totalPipeline)
    ]);

    res.json({ data, total: totalCount[0]?.total || 0, page: +page, limit: +limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buyer Profile Detail ───────────────────────────────────────────────────
router.get('/buyers/:id/profile', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'buyer') return res.status(404).json({ message: 'Buyer not found' });

    let profile = await BuyerProfile.findOne({ user: req.params.id })
      .populate('favouriteManufacturers', 'name company');
    
    if (!profile) {
       // Auto-create if missing
       profile = await BuyerProfile.create({ user: req.params.id });
    }

    const [orders, favorites, complaints, activity] = await Promise.all([
      Order.find({ 'buyer.ref': req.params.id }).sort({ createdAt: -1 }),
      Order.aggregate([
        { $match: { 'buyer.ref': new mongoose.Types.ObjectId(req.params.id) } },
        { $group: { _id: '$manufacturer', count: { $sum: 1 }, spent: { $sum: '$valueRaw' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'mfr' } },
        { $unwind: '$mfr' },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Complaint.find({ buyer: req.params.id }).sort({ createdAt: -1 }),
      UserActivity.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(20)
    ]);

    res.json({
      user,
      profile,
      orders,
      favorites,
      complaints,
      activity
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── All Orders (Advanced) ──────────────────────────────────────────────────
router.get('/orders', adminOnly, async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 20, 
      search, 
      sector, 
      minVal, 
      maxVal, 
      startDate, 
      endDate 
    } = req.query;

    const pipeline = [];

    // Filter by Status
    if (status && status !== 'all') {
      pipeline.push({ $match: { status } });
    }

    // Filter by Value
    if (minVal || maxVal) {
      const vFilter = {};
      if (minVal) vFilter.$gte = Number(minVal);
      if (maxVal) vFilter.$lte = Number(maxVal);
      pipeline.push({ $match: { valueRaw: vFilter } });
    }

    // Filter by Date
    if (startDate || endDate) {
      const dFilter = {};
      if (startDate) dFilter.$gte = new Date(startDate);
      if (endDate) dFilter.$lte = new Date(endDate);
      pipeline.push({ $match: { createdAt: dFilter } });
    }

    // Search (ID, Buyer, Manufacturer)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { orderId: { $regex: search, $options: 'i' } },
            { 'buyer.name': { $regex: search, $options: 'i' } },
            { 'buyer.company': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'manufacturer',
        foreignField: '_id',
        as: 'mfrInfo'
      }
    });
    pipeline.push({ $unwind: '$mfrInfo' });

    // Sector Filter (Manufacturer based)
    if (sector) {
      pipeline.push({
        $lookup: {
          from: 'manufacturerprofiles',
          localField: 'manufacturer',
          foreignField: 'user',
          as: 'mfrProfile'
        }
      });
      pipeline.push({ $unwind: '$mfrProfile' });
      pipeline.push({ $match: { 'mfrProfile.sector': sector } });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const totalPipeline = [...pipeline, { $count: 'total' }];
    pipeline.push({ $skip: (+page - 1) * +limit });
    pipeline.push({ $limit: +limit });

    const [data, totalCount] = await Promise.all([
      Order.aggregate(pipeline),
      Order.aggregate(totalPipeline)
    ]);

    res.json({ data, total: totalCount[0]?.total || 0, page: +page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Stuck Orders Monitoring ───────────────────────────────────────────────
router.get('/orders/stuck', adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    const [notDispatched, notConfirmed] = await Promise.all([
      // Confirmed but not dispatched 3+ days
      Order.find({ 
        status: 'Confirmed', 
        updatedAt: { $lte: threeDaysAgo } 
      }).populate('manufacturer', 'name company email phone'),
      
      // Placed but not confirmed 24+ hours
      Order.find({ 
        status: 'New', 
        createdAt: { $lte: twentyFourHoursAgo } 
      }).populate('manufacturer', 'name company email phone')
    ]);

    res.json({ notDispatched, notConfirmed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Order Details ────────────────────────────────────────────────────────
router.get('/orders/:id', adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('manufacturer', 'name company email phone location')
      .populate('products.product', 'name price images');
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Order Admin Updates ──────────────────────────────────────────────────
router.patch('/orders/:id/admin-notes', adminOnly, async (req, res) => {
  try {
    const { notes } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { adminNotes: notes }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/orders/:id/escrow', adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { escrowStatus: status }, { new: true });
    
    // Add to timeline
    order.timeline.push({
      status: `ESCROW_${status.toUpperCase()}`,
      actor: 'admin',
      note: `Escrow status updated to ${status}`
    });
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── All Complaints & Disputes (Advanced) ───────────────────────────────────
router.get('/complaints', adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, type } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (type) filter.category = type;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('buyer', 'name email company')
        .populate('manufacturer', 'name email company')
        .sort({ updatedAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Complaint.countDocuments(filter),
    ]);
    res.json({ data: complaints, total, page: +page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Dispute Intelligence ───────────────────────────────────────────────────
router.get('/complaints/analytics/dispute-rate', adminOnly, async (req, res) => {
  try {
    const ranking = await Complaint.aggregate([
      { $match: { status: { $ne: 'REJECTED' } } },
      { $group: { _id: '$manufacturer', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'mfr' } },
      { $unwind: '$mfr' },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const resolutionStats = await Complaint.aggregate([
      { $match: { 'resolution.decision': { $exists: true, $ne: 'PENDING' } } },
      { $group: { _id: '$resolution.decision', count: { $sum: 1 } } }
    ]);

    res.json({ ranking, resolutionStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Finance & Escrow ────────────────────────────────────────────────────────
router.get('/finance/escrow', adminOnly, async (req, res) => {
  try {
    const totalHeld = await Order.aggregate([
      { $match: { escrowStatus: 'Held' } },
      { $group: { _id: null, total: { $sum: '$valueRaw' } } }
    ]);
    const orders = await Order.find({ escrowStatus: { $ne: 'Pending' } })
      .populate('manufacturer', 'company')
      .sort({ updatedAt: -1 })
      .limit(100);
    res.json({ totalHeld: totalHeld[0]?.total || 0, orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/finance/commissions', adminOnly, async (req, res) => {
  try {
    const comms = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { 
          _id: { $month: '$createdAt' }, 
          totalValue: { $sum: '$valueRaw' },
          commAmount: { $sum: { $multiply: ['$valueRaw', 0.1] } } // Assuming 10%
      }},
      { $sort: { _id: -1 } }
    ]);
    res.json(comms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Deep Analytics ─────────────────────────────────────────────────────────
router.get('/analytics/gmv-trend', adminOnly, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const trend = await Order.aggregate([
      { $match: { createdAt: { $gte: start }, status: { $ne: 'Cancelled' } } },
      { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, 
          gmv: { $sum: '$valueRaw' },
          orders: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    res.json(trend);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/analytics/sectors', adminOnly, async (req, res) => {
  try {
    const sectorStats = await Order.aggregate([
      { $lookup: { from: 'manufacturerprofiles', localField: 'manufacturer', foreignField: 'user', as: 'p' } },
      { $unwind: '$p' },
      { $group: { _id: '$p.sector', gmv: { $sum: '$valueRaw' }, volume: { $sum: 1 } } },
      { $sort: { gmv: -1 } }
    ]);
    res.json(sectorStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/analytics/geography', adminOnly, async (req, res) => {
  try {
    const geo = await Order.aggregate([
      { $group: { _id: '$deliveryAddress.state', count: { $sum: 1 }, gmv: { $sum: '$valueRaw' } } },
      { $sort: { count: -1 } }
    ]);
    res.json(geo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Plan Management ─────────────────────────────────────────────────────────
router.get('/plans', adminOnly, async (req, res) => {
  try {
    const plans = await PricingPlan.find();
    // Injects stats
    const stats = await User.aggregate([
      { $match: { role: 'manufacturer' } },
      { $group: { _id: '$planType', count: { $sum: 1 } } }
    ]);
    res.json({ plans, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/plans/override', adminOnly, async (req, res) => {
  try {
    const { userId, planType, reason } = req.body;
    const user = await User.findByIdAndUpdate(userId, { planType }, { new: true });
    // Log in UserActivity
    await UserActivity.create({
       user: req.user._id,
       role: 'admin',
       action: 'PLAN_OVERRIDE',
       metadata: { targetUser: userId, oldPlan: user.planType, newPlan: planType, reason }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Broadcasts ─────────────────────────────────────────────────────────────
router.post('/broadcasts', adminOnly, async (req, res) => {
  try {
    const broadcast = await Broadcast.create({ ...req.body, createdBy: req.user._id });
    // Simulating sending (would trigger background job)
    broadcast.status = 'SENT';
    broadcast.sentAt = new Date();
    await broadcast.save();
    res.json(broadcast);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/broadcasts', adminOnly, async (req, res) => {
  try {
    const list = await Broadcast.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Dispute Resolution Detail ──────────────────────────────────────────────
router.get('/complaints/:id', adminOnly, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('buyer', 'name email phone company')
      .populate('manufacturer', 'name email phone company');
    
    if (!complaint) return res.status(404).json({ message: 'Dispute not found' });

    // Fetch related order info
    const order = await Order.findOne({ orderId: complaint.orderId }) || await Order.findById(complaint.order);
    
    res.json({ complaint, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Execute Dispute Resolution ──────────────────────────────────────────────
router.patch('/complaints/:id/dispute-resolve', adminOnly, async (req, res) => {
  try {
    const { decision, refundAmount, adminNote } = req.body;
    
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = 'RESOLVED';
    complaint.resolution = {
      decision,
      refundAmount: Number(refundAmount) || 0,
      adminNote,
      resolvedAt: new Date(),
      resolvedBy: req.user._id
    };

    const order = await Order.findOne({ orderId: complaint.orderId }) || await Order.findById(complaint.order);
    
    // Logic for Refund / Escrow
    if (order && (decision === 'FAVOUR_BUYER' || decision === 'PARTIAL_REFUND')) {
       order.escrowStatus = decision === 'FAVOUR_BUYER' ? 'Refunded' : 'Held'; // Partial might need held for adjustment
       order.timeline.push({
          status: 'DISPUTE_REFUND_TRIGGERED',
          actor: 'admin',
          note: `Auto-refund of ₹${refundAmount} triggered via Dispute Resolution.`
       });
       await order.save();
    }

    await complaint.save();

    // Create notifications for both
    const notifyParties = [complaint.buyer, complaint.manufacturer];
    for (const userId of notifyParties) {
       if (userId) {
          await Notification.create({
            user: userId,
            type: 'dispute_resolved',
            title: 'Dispute Resolution Finalized',
            message: `The dispute #${complaint.complaintId} has been resolved: ${decision.replace(/_/g, ' ')}. Check your dashboard for details.`,
            link: '/dashboard/disputes',
            refModel: 'Complaint',
            refId: complaint._id,
          });
       }
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Nudge Manufacturer for Response ──────────────────────────────────────────
router.post('/complaints/:id/nudge', adminOnly, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    await Notification.create({
       user: complaint.manufacturer,
       type: 'dispute_reminder',
       title: 'URGENT: Dispute Response Required',
       label: 'ACTION REQUIRED',
       message: `You haven't responded to dispute #${complaint.complaintId}. Please provide your evidence within the next 24 hours to avoid administrative override.`,
       link: '/manufacturer/complaints'
    });

    res.json({ success: true, message: 'Nudge transmitted successfully' });
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

// ── Global Activity Logs ────────────────────────────────────────────────────
router.get('/logs/global', adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 50, user, action, isSuspicious } = req.query;
    const filter = {};
    if (user) filter.$or = [{ 'user.name': { $regex: user, $options: 'i' } }, { 'user.email': { $regex: user, $options: 'i' } }];
    if (action) filter.action = action;
    if (isSuspicious === 'true') filter.isSuspicious = true;

    const [logs, total] = await Promise.all([
      UserActivity.find(filter)
        .populate('user', 'name email role company')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      UserActivity.countDocuments(filter)
    ]);

    res.json({ data: logs, total, page: +page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buyer Behaviour Analytics ───────────────────────────────────────────────
router.get('/buyers/:id/activity-stats', adminOnly, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.id);
    const now = new Date();
    const last30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [loginFrequency, queries, cart] = await Promise.all([
      UserActivity.aggregate([
        { $match: { user: userId, action: 'LOGIN', createdAt: { $gte: last30 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      UserActivity.find({ user: userId, action: 'SEARCH' }).sort({ createdAt: -1 }).limit(10),
      Cart.findOne({ user: userId }).populate('items.product', 'name price')
    ]);

    res.json({ loginFrequency, queries, cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Fraud & Risks ────────────────────────────────────────────────────────────
router.get('/flags', adminOnly, async (req, res) => {
  try {
    const { status = 'active', severity, type } = req.query;
    const filter = { status };
    if (severity) filter.severity = severity;
    if (type) filter.flagType = type;

    const flags = await SystemFlag.find(filter)
      .populate('subjectUser', 'name email company role')
      .populate('involvedUsers', 'name email company role')
      .sort({ createdAt: -1 });

    res.json(flags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/flags/run-scan', adminOnly, async (req, res) => {
  try {
    const newFlags = await runFraudDetection();
    res.json({ message: 'Scan complete', newFlagsCount: newFlags.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/flags/:id/resolve', adminOnly, async (req, res) => {
  try {
    const { status, note } = req.body;
    const flag = await SystemFlag.findByIdAndUpdate(
      req.params.id,
      { status, resolutionNote: note, resolvedBy: req.user._id },
      { new: true }
    );
    res.json(flag);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/flags/summary', adminOnly, async (req, res) => {
  try {
    const summary = await SystemFlag.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
