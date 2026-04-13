import { Router } from 'express';
import QuickReply from '../models/QuickReply.js';
import Order from '../models/Order.js';
import Deal from '../models/Deal.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/manufacturer/check-call-context/:mfrId
 * @desc    Check if buyer can schedule call with manufacturer
 */
router.get('/check-call-context/:mfrId', protect, async (req, res) => {
  try {
    const { mfrId } = req.params;
    const buyerId = req.user._id;

    // Rule: Must have an active order
    const hasOrder = await Order.findOne({
      'buyer.ref': buyerId,
      manufacturer: mfrId,
      status: { $nin: ['Delivered', 'Rejected', 'Cancelled'] }
    });

    // OR: Must have a deep negotiation (Round > 1)
    const hasNegotiation = await Deal.findOne({
      buyer: buyerId,
      manufacturer: mfrId,
      round: { $gt: 1 }
    });

    res.json({
      canSchedule: !!(hasOrder || hasNegotiation),
      reason: !(hasOrder || hasNegotiation) ? 'Calls are reserved for active orders or ongoing negotiations.' : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route   GET /api/manufacturer/quick-replies
 * @desc    Get all quick replies for current manufacturer
 */
router.get('/quick-replies', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const replies = await QuickReply.find({ manufacturer: req.user._id });
    
    // Add default templates if none exist
    if (replies.length === 0) {
      const defaults = [
        { title: 'Dispatch Date', message: 'Your order will be dispatched by [date].', manufacturer: req.user._id, isDefault: true },
        { title: 'Stock Availability', message: 'Yes, we have sufficient stock for your requirement.', manufacturer: req.user._id, isDefault: true },
        { title: 'MOQ Policy', message: 'Our minimum order quantity is fixed to ensure best pricing.', manufacturer: req.user._id, isDefault: true },
        { title: 'Payment Confirmation', message: 'We have received your payment. Processing your order now.', manufacturer: req.user._id, isDefault: true }
      ];
      const saved = await QuickReply.insertMany(defaults);
      return res.json(saved);
    }
    
    res.json(replies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route   POST /api/manufacturer/quick-replies
 * @desc    Add a new quick reply template
 */
router.post('/quick-replies', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { title, message } = req.body;
    const reply = await QuickReply.create({
      manufacturer: req.user._id,
      title,
      message
    });
    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route   DELETE /api/manufacturer/quick-replies/:id
 * @desc    Delete a quick reply template
 */
router.delete('/quick-replies/:id', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const reply = await QuickReply.findOneAndDelete({ _id: req.params.id, manufacturer: req.user._id });
    if (!reply) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
