import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import Order from '../models/Order.js';
import Shipment from '../models/Shipment.js';
import Deal from '../models/Deal.js';
import Product from '../models/Product.js';
import Complaint from '../models/Complaint.js';
import CallSchedule from '../models/CallSchedule.js';
import ManufacturerProfile from '../models/ManufacturerProfile.js';

const router = Router();

// POST /api/manufacturer/profile — Create or update manufacturer profile from onboarding
router.post('/profile', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const {
      companyName, tradeName, description, mainCategory, subCategory, capacity,
      gstNumber, panNumber, msmeNumber, bizDocUrl, gstCertUrl,
      address, bank, logoUrl, bannerUrl, factoryPhotos, certifications
    } = req.body;

    let profile = await ManufacturerProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new ManufacturerProfile({ user: req.user._id });
    }

    // Assign mapped fields
    if (gstNumber) profile.gstNumber = gstNumber;
    if (panNumber) profile.panNumber = panNumber;
    if (msmeNumber) profile.msmeNumber = msmeNumber;
    if (tradeName) profile.tradeName = tradeName;
    if (description) profile.description = description;
    if (mainCategory) profile.mainCategory = mainCategory;
    if (subCategory) profile.subCategory = subCategory;
    if (capacity) profile.capacity = capacity;
    if (bizDocUrl) profile.bizDocUrl = bizDocUrl;
    if (gstCertUrl) profile.gstCertUrl = gstCertUrl;
    
    // Address mapping
    if (address) {
      profile.address = {
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: 'India',
      };
    }
    
    // Bank mapping
    if (bank) {
      profile.bankDetails = {
        accountName: companyName || '',
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        bankName: bank.bankName,
        branch: '',
      };
    }

    // Media and categories array mapping
    if (logoUrl) profile.logo = logoUrl;
    if (bannerUrl) profile.profileBanner = bannerUrl;
    if (factoryPhotos && Array.isArray(factoryPhotos)) profile.factoryImages = factoryPhotos;
    if (certifications && Array.isArray(certifications)) profile.certifications = certifications;

    // Default status
    profile.status = 'pending';

    await profile.save();
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/manufacturer/stats — dashboard summary cards
router.get('/stats', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const mfrId = req.user._id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [
      allTodayOrders,
      all30DaysOrders,
      pendingConfirmations,
      lowStockAlerts,
      openComplaints,
      upcomingCalls,
      totalProducts
    ] = await Promise.all([
      Order.find({ manufacturer: mfrId, createdAt: { $gte: today, $lt: tomorrow } }),
      Order.find({ manufacturer: mfrId, createdAt: { $gte: thirtyDaysAgo } }),
      Order.countDocuments({ manufacturer: mfrId, status: 'New' }),
      Product.countDocuments({ manufacturer: mfrId, stock: { $lt: 50 }, isActive: true }),
      Complaint.countDocuments({ manufacturer: mfrId, status: { $ne: 'RESOLVED' } }),
      CallSchedule.countDocuments({ manufacturer: mfrId, scheduledAt: { $gte: today }, status: 'confirmed' }),
      Product.countDocuments({ manufacturer: mfrId, isActive: true }),
    ]);

    const profile = await ManufacturerProfile.findOne({ user: mfrId }).select('holidaySettings');

    const todayRevenue = allTodayOrders.reduce((sum, o) => sum + (Number(o.valueRaw) || 0), 0);
    const last30DaysRevenue = all30DaysOrders.reduce((sum, o) => sum + (Number(o.valueRaw) || 0), 0);

    res.json({
      todayRevenue,
      last30DaysRevenue,
      todayOrderCount: allTodayOrders.length,
      last30DaysOrderCount: all30DaysOrders.length,
      pendingConfirmations,
      lowStockAlerts,
      openComplaints,
      upcomingCalls,
      totalProducts,
      holidaySettings: profile?.holidaySettings ?? {}
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Holiday Calendar Routes ───────────────────────────────────────────────────

// GET /api/manufacturer/holiday — get my holiday settings
router.get('/holiday', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const profile = await ManufacturerProfile.findOne({ user: req.user._id })
      .select('holidaySettings');
    res.json(profile?.holidaySettings ?? {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/manufacturer/holiday — save holiday settings
router.patch('/holiday', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const {
      weeklyOffDays, holidays, backInOfficeDate,
      autoResponse, isOnHoliday
    } = req.body;

    const profile = await ManufacturerProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // If toggling holiday ON, record start date & reset stats
    const wasOff = profile.holidaySettings?.isOnHoliday;
    if (isOnHoliday && !wasOff) {
      profile.holidaySettings = {
        ...profile.holidaySettings,
        holidayStats: {
          ordersReceived: 0,
          negotiationsStarted: 0,
          complaintsReceived: 0,
          holidayStartDate: new Date().toISOString().split('T')[0],
        },
        showWelcomeBack: false,
      };
    }

    // If toggling holiday OFF, flag welcome-back
    if (!isOnHoliday && wasOff) {
      profile.holidaySettings = {
        ...profile.holidaySettings,
        showWelcomeBack: true,
      };
    }

    if (weeklyOffDays !== undefined) profile.holidaySettings.weeklyOffDays  = weeklyOffDays;
    if (holidays      !== undefined) profile.holidaySettings.holidays        = holidays;
    if (backInOfficeDate !== undefined) profile.holidaySettings.backInOfficeDate = backInOfficeDate;
    if (autoResponse  !== undefined) profile.holidaySettings.autoResponse    = autoResponse;
    if (isOnHoliday   !== undefined) profile.holidaySettings.isOnHoliday     = isOnHoliday;

    profile.markModified('holidaySettings');
    await profile.save();
    res.json(profile.holidaySettings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/manufacturer/holiday/dismiss-welcome — clear the welcome-back banner
router.patch('/holiday/dismiss-welcome', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const profile = await ManufacturerProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.holidaySettings.showWelcomeBack = false;
    profile.markModified('holidaySettings');
    await profile.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/manufacturer/holiday/check/:manufacturerId — public, used by buyer side
router.get('/holiday/check/:manufacturerId', async (req, res) => {
  try {
    const profile = await ManufacturerProfile.findOne({ user: req.params.manufacturerId })
      .select('holidaySettings');
    const hs = profile?.holidaySettings;
    if (!hs) return res.json({ isOnHoliday: false });

    // Check if today is a weekly off day
    const todayDow = new Date().getDay(); // 0=Sun
    const isWeeklyOff = (hs.weeklyOffDays || []).includes(todayDow);

    // Check if today is a specific holiday
    const todayStr = new Date().toISOString().split('T')[0];
    const isSpecificHoliday = (hs.holidays || []).some(h => h.date === todayStr);

    const effectivelyOff = hs.isOnHoliday || isWeeklyOff || isSpecificHoliday;
    res.json({
      isOnHoliday: effectivelyOff,
      backInOfficeDate: hs.backInOfficeDate || '',
      autoResponse: hs.autoResponse || '',
      weeklyOffDays: hs.weeklyOffDays || [],
      holidays: hs.holidays || [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
