import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import CallSchedule from '../models/CallSchedule.js';
import ManufacturerProfile from '../models/ManufacturerProfile.js';
import Notification from '../models/Notification.js';
import { isManufacturerOff } from '../utils/holidayHelper.js';

const router = Router();

// GET /api/schedule — list calls for current user
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'manufacturer'
      ? { manufacturer: req.user._id }
      : { buyer: req.user._id };

    const calls = await CallSchedule.find(filter)
      .populate('manufacturer', 'name company avatar')
      .populate('buyer', 'name company avatar')
      .sort({ scheduledAt: 1 });

    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/schedule — book a call
router.post('/', protect, requireRole('buyer'), async (req, res) => {
  try {
    const { manufacturerId, scheduledAt, duration = 30, purpose, dealId } = req.body;

    if (!manufacturerId || !scheduledAt) {
      return res.status(400).json({ message: 'manufacturerId and scheduledAt are required' });
    }

    const checkDate = new Date(scheduledAt);
    const { isOff, settings } = await isManufacturerOff(manufacturerId, checkDate);
    if (isOff) {
      const returnDate = settings.backInOfficeDate 
        ? new Date(settings.backInOfficeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
        : 'soon';
      return res.status(400).json({ 
        message: `Manufacturer is not available on this date. They will be back in office on ${returnDate}.` 
      });
    }

    const call = await CallSchedule.create({
      manufacturer: manufacturerId,
      buyer: req.user._id,
      deal: dealId ?? undefined,
      scheduledAt: checkDate,
      duration,
      purpose,
    });

    // Notify manufacturer
    await Notification.create({
      user: manufacturerId,
      type: 'call_scheduled',
      title: 'New Call Scheduled',
      message: `${req.user.name} from ${req.user.company ?? 'a company'} has requested a ${duration}-min call on ${new Date(scheduledAt).toLocaleDateString()}.`,
      link: '/manufacturer/scheduled-calls',
      refModel: 'CallSchedule',
      refId: call._id,
    });

    const populated = await call.populate('manufacturer buyer', 'name company avatar email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/schedule/:id/confirm
router.patch('/:id/confirm', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { meetingLink } = req.body;
    const call = await CallSchedule.findOneAndUpdate(
      { _id: req.params.id, manufacturer: req.user._id },
      { status: 'confirmed', meetingLink },
      { new: true }
    ).populate('buyer', 'name company email');

    if (!call) return res.status(404).json({ message: 'Call not found' });

    // Notify buyer
    if (call.buyer) {
      await Notification.create({
        user: call.buyer._id,
        type: 'call_scheduled',
        title: 'Call Confirmed!',
        message: `Your call on ${new Date(call.scheduledAt).toLocaleDateString()} has been confirmed.${meetingLink ? ' Meeting link added.' : ''}`,
        link: '/buyer/schedule',
        refModel: 'CallSchedule',
        refId: call._id,
      });
    }

    res.json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/schedule/:id/cancel
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const filter = req.user.role === 'manufacturer'
      ? { _id: req.params.id, manufacturer: req.user._id }
      : { _id: req.params.id, buyer: req.user._id };

    const call = await CallSchedule.findOneAndUpdate(
      filter,
      { status: 'cancelled', cancelReason: reason },
      { new: true }
    ).populate('manufacturer buyer', 'name company');

    if (!call) return res.status(404).json({ message: 'Call not found' });
    res.json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/schedule/:id/reschedule
router.patch('/:id/reschedule', protect, async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    const filter = req.user.role === 'manufacturer'
      ? { _id: req.params.id, manufacturer: req.user._id }
      : { _id: req.params.id, buyer: req.user._id };

    const call = await CallSchedule.findOne(filter);
    if (!call) return res.status(404).json({ message: 'Call not found' });

    call.rescheduledFrom = call.scheduledAt;
    call.scheduledAt = new Date(scheduledAt);
    call.status = 'pending';
    call.rescheduleCount = (call.rescheduleCount || 0) + 1;
    await call.save();

    res.json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/schedule/availability/:manufacturerId
router.get('/availability/:manufacturerId', async (req, res) => {
  try {
    const { date } = req.query; // optional date to check
    const profile = await ManufacturerProfile.findOne({ user: req.params.manufacturerId })
      .select('availability holidaySettings');

    // If a specific date is checked, respect holidays
    if (date) {
      const checkDate = new Date(date);
      const { isOff } = await isManufacturerOff(req.params.manufacturerId, checkDate);
      if (isOff) return res.json([]); // No availability on holidays
    }

    res.json({
      availability: profile?.availability ?? [],
      holidaySettings: profile?.holidaySettings ?? {}
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/schedule/availability — manufacturer sets availability
router.patch('/availability', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { availability } = req.body;
    const profile = await ManufacturerProfile.findOneAndUpdate(
      { user: req.user._id },
      { availability },
      { new: true, upsert: true }
    );
    res.json(profile.availability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
