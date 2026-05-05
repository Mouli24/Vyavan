import { Router } from 'express';
import Deal from '../models/Deal.js';
import Notification from '../models/Notification.js';
import { protect, requireRole } from '../middleware/auth.js';
import { handleHolidayAutomation } from '../utils/holidayHelper.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const router = Router();

// GET /api/deals  — manufacturer sees all their deals
router.get('/', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const deals = await Deal.find({ manufacturer: req.user._id })
      .populate('buyer', 'name company avatar')
      .populate('product', 'name price unit image')
      .sort({ createdAt: -1 });

    const processed = deals.map(d => {
      // Auto-expire check
      if (d.expiresAt && new Date() > d.expiresAt && !['Accepted', 'Rejected', 'Expired', 'Converted to Order'].includes(d.status)) {
        d.status = 'Expired';
        d.save(); 
      }
      
      const now = Date.now();
      const diff = now - d.createdAt.getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const time = hours > 0 ? `${hours}h ago` : `${mins}m ago`;
      return { ...d.toJSON(), time };
    });
    res.json(processed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/deals/buyer — buyer or manufacturer sees their own deals
router.get('/buyer', protect, requireRole('buyer', 'manufacturer'), async (req, res) => {
  try {
    const deals = await Deal.find({ buyer: req.user._id })
      .populate('manufacturer', 'name company avatar')
      .populate('product', 'name price unit image')
      .sort({ createdAt: -1 });

    const processed = deals.map(d => {
      // Auto-expire check
      if (d.expiresAt && new Date() > d.expiresAt && !['Accepted', 'Rejected', 'Expired', 'Converted to Order'].includes(d.status)) {
        d.status = 'Expired';
        d.save(); 
      }

      const now = Date.now();
      const diff = now - d.createdAt.getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const time = hours > 0 ? `${hours}h ago` : `${mins}m ago`;
      return { ...d.toJSON(), time };
    });
    res.json(processed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/deals/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('buyer', 'name company')
      .populate('manufacturer', 'name company')
      .populate('product', 'name price unit image');
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    res.json(deal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/deals  — user initiates a deal
router.post('/', protect, requireRole('buyer', 'manufacturer'), async (req, res) => {
  try {
    const { manufacturer, product, quantity, requestedPrice, requestedTerm, title, subtitle, message } = req.body;

    const prodDoc = await mongoose.model('Product').findById(product);
    if (!prodDoc) return res.status(404).json({ message: 'Product not found' });

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
    let status = 'New Offer';
    let rejectionReason = null;

    // Auto-reject if below floorPrice
    if (requestedPrice < (prodDoc.floorPrice || 0)) {
       status = 'Rejected';
       rejectionReason = 'Auto-rejected: Price below minimum threshold.';
    }

    const deal = await Deal.create({
      title,
      subtitle,
      manufacturer,
      product,
      quantity,
      requestedPrice,
      priceRaw: requestedPrice,
      price: `₹${requestedPrice.toLocaleString()}`,
      requestedTerm: requestedTerm || 'advance_100',
      buyer: req.user._id,
      status,
      rejectionReason,
      expiresAt,
      floorPrice: prodDoc.floorPrice, // snapshot at start
      counterBy: status === 'Rejected' ? 'buyer' : 'manufacturer',
      negotiationHistory: [{
        round: 1,
        offeredBy: 'buyer',
        price: requestedPrice,
        term: requestedTerm || 'advance_100',
        message: message || `Initial offer for ${quantity} units`
      }]
    });

    // Notify manufacturer
    await Notification.create({
      user: manufacturer,
      type: 'negotiation_offer',
      title: status === 'Rejected' ? 'Auto-Rejected Negotiation' : 'New Negotiation Request',
      message: status === 'Rejected' 
        ? `A new request from ${req.user.name} was auto-rejected due to low price.`
        : `${req.user.name} from ${req.user.company || 'a company'} has sent a negotiation offer.`,
      link: '/manufacturer/negotiation',
      refModel: 'Deal',
      refId: deal._id,
    });

    // Holiday behavior
    await handleHolidayAutomation(manufacturer, req.user._id, 'negotiation');

    const populated = await deal.populate('buyer manufacturer product', 'name company price unit image');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Error initiating deal:', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/deals/:id  — handle counters/accept/reject
router.patch('/:id', protect, async (req, res) => {
  try {
    const { status, requestedPrice, requestedTerm, message } = req.body;
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    // Permissions
    const isMfr = req.user._id.toString() === deal.manufacturer.toString();
    const isBuyer = req.user._id.toString() === deal.buyer.toString();
    if (!isMfr && !isBuyer) return res.status(403).json({ message: 'Unauthorized' });

    // Expiry check
    if (deal.expiresAt && new Date() > deal.expiresAt && !['Accepted', 'Rejected', 'Expired'].includes(deal.status)) {
      deal.status = 'Expired';
      await deal.save();
      return res.status(400).json({ message: 'Negotiation has expired' });
    }

    if (deal.status === 'Accepted' || deal.status === 'Rejected' || deal.status === 'Expired' || deal.status === 'Converted to Order') {
      return res.status(400).json({ message: 'Deal is already closed' });
    }

    if (status === 'Accepted' || status === 'Rejected') {
      if (status === 'Rejected' && !message) {
        return res.status(400).json({ message: 'Reason for rejection is mandatory' });
      }
      deal.status = status;
      if (status === 'Rejected') deal.rejectionReason = message;
      if (status === 'Accepted') deal.acceptedAt = new Date();
    } else if (status === 'Negotiating') {
      // Counter offer logic
      const turn = isMfr ? 'manufacturer' : 'buyer';
      if (deal.counterBy !== turn) {
        return res.status(400).json({ message: "It's not your turn to counter" });
      }

      if (deal.round >= deal.maxRounds) {
        return res.status(400).json({ message: 'Maximum negotiation rounds reached' });
      }

      const newPrice = requestedPrice || deal.requestedPrice;

      // Check auto-reject during buyer counter
      if (!isMfr) {
        // Fetch current product to check updated floorPrice if allowed
        const prod = await mongoose.model('Product').findById(deal.product);
        if (prod && newPrice < (prod.floorPrice || 0)) {
          deal.status = 'Rejected';
          deal.rejectionReason = 'Auto-rejected: Price below minimum threshold.';
          deal.negotiationHistory.push({
            round: deal.round + 1,
            offeredBy: 'buyer',
            price: newPrice,
            term: requestedTerm || deal.requestedTerm,
            message: message || 'Buyer sent a counter'
          });
          await deal.save();
          
          // Notify manufacturer of auto-reject
          await Notification.create({
            user: deal.manufacturer,
            type: 'negotiation_rejected',
            title: 'Negotiation Auto-Rejected',
             message: `Buyer's counter-offer for "${deal.title}" was auto-rejected.`,
            link: '/manufacturer/negotiation',
            refModel: 'Deal',
            refId: deal._id,
          });
          return res.json(deal);
        }
      }

      deal.round += 1;
      deal.requestedPrice = newPrice;
      deal.price = `₹${deal.requestedPrice.toLocaleString()}`;
      deal.requestedTerm = requestedTerm || deal.requestedTerm;
      deal.counterBy = isMfr ? 'buyer' : 'manufacturer';
      deal.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // Reset for another 48h
      
      deal.negotiationHistory.push({
        round: deal.round,
        offeredBy: turn,
        price: deal.requestedPrice,
        term: deal.requestedTerm,
        message: message || (isMfr ? 'Manufacturer sent a counter' : 'Buyer sent a counter')
      });
    }

    await deal.save();

    // Re-populate to ensure frontend has all necessary fields (name, company, etc.)
    const finalDeal = await Deal.findById(deal._id).populate('buyer manufacturer product', 'name company price unit image');

    // Notify other party
    const recipient = isMfr ? deal.buyer : deal.manufacturer;
    const typeMap = { Accepted: 'negotiation_accepted', Rejected: 'negotiation_rejected', Negotiating: 'negotiation_counter' };
    
    await Notification.create({
      user: recipient,
      type: typeMap[status] || 'negotiation_counter',
      title: `Negotiation ${status}`,
      message: status === 'Negotiating' 
        ? `Counter-offer on "${deal.title}" for ₹${deal.requestedPrice.toLocaleString()} (${deal.requestedTerm?.replace(/_/g, ' ') || 'Advance'})` 
        : `Update on "${deal.title}" by ${req.user.name}.`,
      link: isMfr ? '/buyer/dashboard' : '/manufacturer/negotiation',
      refModel: 'Deal',
      refId: deal._id,
    });

    res.json(finalDeal);
  } catch (err) {
    console.error('Error updating deal:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/deals/:id/convert — User converts accepted deal to order
router.post('/:id/convert', protect, requireRole('buyer', 'manufacturer'), async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, buyer: req.user._id, status: 'Accepted' })
      .populate('product');
    if (!deal) return res.status(400).json({ message: 'Only accepted deals can be converted to orders' });

    // 24h window check
    const now = new Date();
    const acceptedAt = deal.acceptedAt || deal.updatedAt;
    const diffHours = (now.getTime() - acceptedAt.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) {
       deal.status = 'Expired';
       await deal.save();
       return res.status(400).json({ message: 'The 24-hour window to place this order has expired.' });
    }

    const orderId = `#ORD-NEG-${Date.now().toString().slice(-5)}`;
    const order = await Order.create({
      orderId,
      buyer: {
        name: req.user.name,
        location: req.user.location ?? '',
        initials: req.user.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        ref: req.user._id,
      },
      manufacturer: deal.manufacturer,
      items: `${deal.quantity}x ${deal.product?.name || 'Product'}`,
      value: `₹${(deal.requestedPrice * deal.quantity).toLocaleString()}`,
      valueRaw: deal.requestedPrice * deal.quantity,
      products: [{ product: deal.product?._id, quantity: deal.quantity }],
      deliveryAddress: req.body.deliveryAddress // Expected from frontend
    });

    deal.status = 'Converted to Order';
    await deal.save();

    // Notify manufacturer
    await Notification.create({
      user: deal.manufacturer,
      type: 'order_placed',
      title: 'Negotiation Converted to Order',
      message: `Buyer has placed an order based on your accepted negotiation for ${deal.title}.`,
      refModel: 'Order',
      refId: order._id,
    });

    res.status(201).json({ order, deal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
