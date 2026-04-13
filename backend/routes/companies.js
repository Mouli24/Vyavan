import { Router } from 'express';
import User from '../models/User.js';
import ManufacturerProfile from '../models/ManufacturerProfile.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// GET /api/companies — list approved manufacturers (public, supports search/filter)
router.get('/', async (req, res) => {
  try {
    const { q, category, location, code, page = 1, limit = 12 } = req.query;

    // Find profiles with optional category or code filter
    const profileFilter = {};
    if (category) profileFilter.categories = { $in: [category] };
    if (code) profileFilter.companyCode = { $regex: code, $options: 'i' };

    const profiles = await ManufacturerProfile.find(profileFilter).lean();
    const profileUserIds = profiles.map(p => p.user.toString());

    // Find approved manufacturer users
    const userFilter = { 
      role: 'manufacturer', 
      manufacturerStatus: 'approved', 
      isActive: true 
    };

    if (q) {
      userFilter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
      ];
    }
    if (location) userFilter.location = { $regex: location, $options: 'i' };
    
    // If we filtered by profiles (categories or code), restrict users to those profiles
    if (category || code) {
      userFilter._id = { $in: profileUserIds };
    }

    const users = await User.find(userFilter).select('-password').lean();
    const finalUserIds = users.map(u => u._id.toString());
    
    const profileMap = Object.fromEntries(
      profiles
        .filter(p => finalUserIds.includes(p.user.toString()))
        .map(p => [p.user.toString(), p])
    );

    // Filter users that have profiles (if category filter applied)
    const filteredUsers = category
      ? users.filter(u => profileMap[u._id.toString()])
      : users;

    const total = filteredUsers.length;
    const start = (+page - 1) * +limit;
    const paginatedUsers = filteredUsers.slice(start, start + +limit);

    const data = paginatedUsers.map(u => ({
      ...u,
      profile: profileMap[u._id.toString()] ?? null,
    }));

    res.json({ data, total, page: +page, limit: +limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/companies/by-code/:code — look up by company code
router.get('/by-code/:code', async (req, res) => {
  try {
    const profile = await ManufacturerProfile.findOne({
      companyCode: req.params.code.toUpperCase(),
    }).populate('user', '-password');

    if (!profile) return res.status(404).json({ message: 'Company not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/companies/:id — manufacturer public profile + products
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'manufacturer') {
      return res.status(404).json({ message: 'Manufacturer not found' });
    }

    const profile = await ManufacturerProfile.findOne({ user: req.params.id });
    const products = await Product.find({ manufacturer: req.params.id, isActive: true })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ user, profile, products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/companies/profile — manufacturer creates/updates their profile
router.post('/profile', protect, async (req, res) => {
  try {
    if (req.user.role !== 'manufacturer') {
      return res.status(403).json({ message: 'Only manufacturers can set up a profile' });
    }

    const {
      gstNumber, panNumber, msmeNumber, cinNumber,
      address, yearEstablished, employeeCount, annualTurnover,
      categories, certifications, factoryImages, profileBanner, logo,
      bankDetails, exportMarkets,
    } = req.body;

    const profile = await ManufacturerProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        gstNumber, panNumber, msmeNumber, cinNumber,
        address, yearEstablished, employeeCount, annualTurnover,
        categories, certifications, factoryImages, profileBanner, logo,
        bankDetails, exportMarkets,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/companies/profile/me — manufacturer gets own profile
router.get('/profile/me', protect, async (req, res) => {
  try {
    if (req.user.role !== 'manufacturer') {
      return res.status(403).json({ message: 'Manufacturers only' });
    }
    const profile = await ManufacturerProfile.findOne({ user: req.user._id });
    res.json(profile ?? {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
