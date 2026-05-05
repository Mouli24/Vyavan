import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import Order from '../models/Order.js';
import Shipment from '../models/Shipment.js';
import Deal from '../models/Deal.js';
import Product from '../models/Product.js';
import Complaint from '../models/Complaint.js';
import CallSchedule from '../models/CallSchedule.js';
import ManufacturerProfile from '../models/ManufacturerProfile.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// POST /api/manufacturer/profile — Create or update manufacturer profile from onboarding
router.post('/profile', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const {
      companyName, tradeName, description, mainCategory, subCategory, capacity,
      factoryCapacity, contactPerson, geoLocation,
      gstNumber, panNumber, msmeNumber, udyamNumber, cinNumber, bizDocUrl, gstCertUrl, certificationDocs,
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
    if (udyamNumber) profile.udyamNumber = udyamNumber;
    if (tradeName) profile.tradeName = tradeName;
    if (description) profile.description = description;
    if (mainCategory) profile.mainCategory = mainCategory;
    if (subCategory) profile.subCategory = subCategory;
    if (capacity) profile.capacity = capacity;
    if (factoryCapacity) profile.factoryCapacity = factoryCapacity;
    if (contactPerson) profile.contactPerson = contactPerson;
    if (geoLocation) profile.geoLocation = geoLocation;
    if (bizDocUrl) profile.bizDocUrl = bizDocUrl;
    if (gstCertUrl) profile.gstCertUrl = gstCertUrl;
    if (certificationDocs) profile.certificationDocs = certificationDocs;
    if (cinNumber) profile.cinNumber = cinNumber;
    
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

// POST /api/manufacturer/activate — Enter 6-digit code to unlock dashboard
router.post('/activate', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Activation code is required' });

    const profile = await ManufacturerProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    if (profile.status !== 'approved') {
      return res.status(400).json({ message: 'Your account is not yet approved by admin.' });
    }

    if (profile.isActivated) {
      return res.json({ message: 'Dashboard already activated', profile });
    }

    if (profile.activationCode !== code) {
      return res.status(400).json({ message: 'Invalid activation code. Please check your email.' });
    }

    profile.isActivated = true;
    await profile.save();

    res.json({ message: 'Dashboard activated successfully!', profile });
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

// GET /api/manufacturer/onboarding-assistant — AI-driven onboarding guide
router.get('/onboarding-assistant', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const mfrId = req.user._id;

    const [profile, productCount, dealCount, shipmentCount] = await Promise.all([
      ManufacturerProfile.findOne({ user: mfrId }).lean(),
      Product.countDocuments({ manufacturer: mfrId, isActive: true }),
      Deal.countDocuments({ manufacturer: mfrId }),
      Shipment.countDocuments({ manufacturer: mfrId }),
    ]);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: 'v1' });
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const contextData = {
      user: {
        name: req.user.name,
        company: req.user.company,
        email: req.user.email,
        location: req.user.location,
        createdAt: req.user.createdAt,
      },
      profile: profile || { status: 'none', message: 'Profile not created yet.' },
      metrics: {
        total_products: productCount,
        total_deals: dealCount,
        total_shipments: shipmentCount,
      }
    };

    const prompt = `
You are Agent 10, the Onboarding Assistant for B2B Mang (a B2B manufacturing platform).
Your job is to analyze the following user profile and metrics and determine exactly what step they should take next to grow their business on the platform.

Here is the data for the manufacturer:
${JSON.stringify(contextData, null, 2)}

Based on this data, provide a structured onboarding guide. Calculate a realistic "completion_percentage" from 0 to 100 based on their critical fields (like gstNumber, panNumber, address, factoryImages, bankDetails, and having at least 1 product listed). 

Provide a JSON response matching this schema exactly:
{
  "completion_percentage": 50,
  "headline_message": "String (e.g. Finish Your Store Identity Setup)",
  "missing_fields": ["array of missing fields"],
  "next_action": {
    "title": "String (e.g. Add Tax Details)",
    "description": "String (short description of why to do this)",
    "action_button": "String (e.g. Update Profile)",
    "redirect_url": "String (e.g. /manufacturer/settings or /manufacturer/store)"
  },
  "agent_advice": "String (a friendly, encouraging tip addressing them)"
}

Rules for redirect_url:
- For profile/tax/bank edits use: /manufacturer/settings
- For adding products use: /manufacturer/store
- For dealing with orders use: /manufacturer/orders
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    });

    const textPayload = result.response.text();
    const parsedData = JSON.parse(textPayload);

    res.json(parsedData);
  } catch (err) {
    console.error("AI Onboarding Assistant Error:", err);
    res.status(500).json({ message: 'Failed to generate onboarding advice', details: err.message });
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
