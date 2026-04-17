import { Router } from 'express';
import Negotiation from '../models/Negotiation.js';
import NegotiationRound from '../models/NegotiationRound.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// GET /api/negotiation  — List negotiations for current user
router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'manufacturer' 
      ? { manufacturer: req.user._id } 
      : { buyer: req.user._id };

    const negotiations = await Negotiation.find(query)
      .populate('buyer', 'name company avatar')
      .populate('manufacturer', 'name company profile')
      .populate('product', 'name price image category')
      .sort({ lastActivityAt: -1 });

    // Simple expiry check logic
    const now = new Date();
    const updatedNegotiations = await Promise.all(negotiations.map(async (n) => {
      if (n.status === 'Active' && n.expiresAt < now) {
        n.status = 'Expired';
        await n.save();
      }
      return n;
    }));

    res.json(updatedNegotiations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/negotiation/:id — Get details + rounds
router.get('/:id', protect, async (req, res) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id)
      .populate('buyer', 'name company avatar')
      .populate('manufacturer', 'name company profile')
      .populate('product', 'name price image category');

    if (!negotiation) return res.status(404).json({ message: 'Negotiation not found' });

    const rounds = await NegotiationRound.find({ negotiationId: negotiation._id })
      .sort({ roundNumber: 1 });

    res.json({ ...negotiation.toJSON(), rounds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/negotiation — Initiate negotiation (Round 1)
router.post('/', protect, async (req, res) => {
  try {
    const { manufacturer, product, quantity, offeredPrice, message } = req.body;

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h from now

    const negotiation = await Negotiation.create({
      buyer: req.user._id,
      manufacturer,
      product,
      quantity,
      currentOfferPrice: offeredPrice,
      status: 'Initiated',
      expiresAt
    });

    const round = await NegotiationRound.create({
      negotiationId: negotiation._id,
      sender: req.user._id,
      senderRole: req.user.role,
      offeredPrice,
      message,
      roundNumber: 1,
      isLatest: true
    });

    // Notify manufacturer
    await Notification.create({
      user: manufacturer,
      type: 'negotiation_offer',
      title: 'New Price Negotiation',
      message: `${req.user.name} has initiated a negotiation for your product.`,
      link: '/manufacturer/negotiation',
      refModel: 'Negotiation',
      refId: negotiation._id
    });

    res.status(201).json({ ...negotiation.toJSON(), rounds: [round] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/negotiation/:id/counter — Send counter offer
router.post('/:id/counter', protect, async (req, res) => {
  try {
    const { offeredPrice, message } = req.body;
    const negotiation = await Negotiation.findById(req.params.id);

    if (!negotiation) return res.status(404).json({ message: 'Negotiation not found' });
    if (negotiation.status === 'Expired' || negotiation.status === 'Accepted' || negotiation.status === 'Rejected') {
      return res.status(400).json({ message: 'Negotiation is closed' });
    }

    // Mark previous rounds as not latest
    await NegotiationRound.updateMany(
      { negotiationId: negotiation._id, isLatest: true },
      { isLatest: false }
    );

    const newRoundNumber = negotiation.totalRounds + 1;
    const round = await NegotiationRound.create({
      negotiationId: negotiation._id,
      sender: req.user._id,
      senderRole: req.user.role,
      offeredPrice,
      message,
      roundNumber: newRoundNumber,
      isLatest: true
    });

    negotiation.currentOfferPrice = offeredPrice;
    negotiation.totalRounds = newRoundNumber;
    negotiation.status = 'Active';
    negotiation.lastActivityAt = Date.now();
    await negotiation.save();

    // Notify recipient
    const recipientId = req.user.role === 'buyer' ? negotiation.manufacturer : negotiation.buyer;
    await Notification.create({
      user: recipientId,
      type: 'negotiation_counter',
      title: 'Counter Offer Received',
      message: `${req.user.name} sent a counter offer of ₹${offeredPrice.toLocaleString()}.`,
      link: req.user.role === 'buyer' ? '/manufacturer/negotiation' : '/buyer/negotiations',
      refModel: 'Negotiation',
      refId: negotiation._id
    });

    // Real-time Emit
    if (req.io) {
      req.io.to(negotiation._id.toString()).emit('new_round', round);
    }

    res.status(201).json(round);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/negotiation/:id/status — Accept/Reject
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body; // 'Accepted' or 'Rejected'
    const negotiation = await Negotiation.findById(req.params.id);

    if (!negotiation) return res.status(404).json({ message: 'Negotiation not found' });

    negotiation.status = status;
    negotiation.lastActivityAt = Date.now();
    await negotiation.save();

    // Notify counterpart
    const recipientId = req.user.role === 'buyer' ? negotiation.manufacturer : negotiation.buyer;
    await Notification.create({
      user: recipientId,
      type: status === 'Accepted' ? 'negotiation_accepted' : 'negotiation_rejected',
      title: `Negotiation ${status}`,
      message: `The negotiation for your proposal has been ${status.toLowerCase()}.`,
      link: req.user.role === 'buyer' ? '/manufacturer/negotiation' : '/buyer/negotiations',
      refModel: 'Negotiation',
      refId: negotiation._id
    });

    // Real-time Emit
    if (req.io) {
      req.io.to(negotiation._id.toString()).emit('status_update', { status });
    }

    res.json(negotiation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
