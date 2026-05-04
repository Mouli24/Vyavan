import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { token, role } = req.body;
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if not exists
      user = await User.create({
        name,
        email,
        password: Math.random().toString(36).slice(-8), // Dummy password
        role: role || 'buyer',
        avatar: picture,
        isVerified: true
      });
    } else {
      // Update role if explicitly provided (optional, handle with care)
      if (role && user.role !== role) {
        // You might want to handle role conflicts here
      }
    }

    res.json({ token: signToken(user._id), user });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});

// POST /api/auth/register
router.post('/register', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['manufacturer', 'buyer']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role, company, location } = req.body;
  try {
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, role, company, location });

    // Notify Admin Dashboard
    if (req.io) {
      req.io.to('admin_dashboard').emit('new_registration', {
        name: user.name,
        role: user.role,
        company: user.company,
        createdAt: user.createdAt
      });
    }

    res.status(201).json({ token: signToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ token: signToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json(req.user));

// PATCH /api/auth/profile
router.patch('/profile', protect, async (req, res) => {
  const { name, email, phone, company } = req.body;
  
  try {
    const updates = {};
    if (name) updates.name = name;
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existing) return res.status(409).json({ message: 'Email already in use' });
      updates.email = email;
    }
    if (phone) updates.phone = phone;
    if (company) updates.company = company;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/auth/language
router.patch('/language', protect, async (req, res) => {
  const { language } = req.body;
  if (!['en', 'hi', 'te', 'ta', 'kn'].includes(language)) {
    return res.status(400).json({ message: 'Invalid language choice' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { language, languagePreferenceSet: true },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
