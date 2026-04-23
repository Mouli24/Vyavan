import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect, requireRole } from '../middleware/auth.js';
import { handleHolidayAutomation } from '../utils/holidayHelper.js';

const router = Router();

// GET /api/complaints  — manufacturer sees their complaints
router.get('/', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { manufacturer: req.user._id };
    if (status) filter.status = status;
    const complaints = await Complaint.find(filter)
      .populate('buyer', 'name company')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/complaints/my  — buyer sees their own complaints
router.get('/my', protect, requireRole('buyer'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { buyer: req.user._id };
    if (status) filter.status = status;
    const complaints = await Complaint.find(filter)
      .populate('manufacturer', 'name company avatar')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/complaints/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('buyer', 'name company')
      .populate('manufacturer', 'name company');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/complaints  — buyer files a complaint
router.post('/', protect, requireRole('buyer'), [
  body('title').notEmpty(),
  body('company').notEmpty(),
  body('manufacturer').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const id = `TAC-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    const complaint = await Complaint.create({
      ...req.body,
      complaintId: id,
      buyer: req.user._id,
      filingDate: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
    });

    // Notify manufacturer
    await Notification.create({
      user: req.body.manufacturer,
      type: 'complaint_filed',
      title: 'New Complaint Filed',
      message: `${req.user.name} has filed a complaint: "${req.body.title}"`,
      link: '/manufacturer/complaints',
      refModel: 'Complaint',
      refId: complaint._id,
    });

    // Holiday behavior
    await handleHolidayAutomation(req.body.manufacturer, req.user._id, 'complaint');

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/complaints/:id/respond  — manufacturer responds / resolves
router.patch('/:id/respond', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { response, resolution, status } = req.body;
    const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, manufacturer: req.user._id },
      { response, resolution, status },
      { new: true }
    ).populate('buyer', 'name email');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Notify buyer of response
    if (complaint.buyer) {
      await Notification.create({
        user: complaint.buyer._id,
        type: 'complaint_responded',
        title: 'Complaint Response',
        message: `The manufacturer has responded to your complaint "${complaint.title}".`,
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

// PATCH /api/complaints/:id/escalate — buyer escalates to admin
router.patch('/:id/escalate', protect, requireRole('buyer'), async (req, res) => {
  try {
    const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, buyer: req.user._id },
      { status: 'ESCALATED' },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Notify all admins
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(admins.map(admin => Notification.create({
      user: admin._id,
      type: 'complaint_escalated',
      title: 'Complaint Escalated',
      message: `Complaint "${complaint.title}" (${complaint.complaintId}) has been escalated by buyer.`,
      link: '/admin/complaints',
      refModel: 'Complaint',
      refId: complaint._id,
    })));

    // Notify Admin Dashboard
    if (req.io) {
      req.io.to('admin_dashboard').emit('new_flag', {
        title: complaint.title,
        company: complaint.company,
        status: complaint.status,
        updatedAt: complaint.updatedAt
      });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
