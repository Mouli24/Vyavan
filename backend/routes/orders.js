import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import Shipment from '../models/Shipment.js';
import StockLog from '../models/StockLog.js';
import { protect, requireRole } from '../middleware/auth.js';
import { handleHolidayAutomation } from '../utils/holidayHelper.js';
import BuyerGroupLog from '../models/BuyerGroupLog.js';

const router = Router();

// GET /api/orders  — manufacturer sees their orders; buyer sees their orders
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'manufacturer'
      ? { manufacturer: req.user._id }
      : { 'buyer.ref': req.user._id };

    const { status } = req.query;
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('manufacturer', 'name company')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('manufacturer', 'name company')
      .populate('products.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/orders  — buyer or manufacturer places order
router.post('/', protect, requireRole('buyer', 'manufacturer'), async (req, res) => {
  try {
    const { 
      manufacturer, items, value, valueRaw, expectedDate, products, deliveryAddress,
      appliedRewardValue, appliedGroupId 
    } = req.body;
    const orderId = `#ORD-${Date.now().toString().slice(-5)}`;
    const order = await Order.create({
      orderId,
      buyer: {
        name: req.user.name,
        location: req.user.location ?? '',
        initials: req.user.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        ref: req.user._id,
      },
      manufacturer,
      items,
      value,
      valueRaw,
      expectedDate,
      products,
      deliveryAddress,
      appliedRewardValue,
      appliedGroupId
    });

    // Holiday behavior
    await handleHolidayAutomation(manufacturer, req.user._id, 'order');

    // Reward Log
    if (appliedGroupId) {
      await BuyerGroupLog.create({
        group: appliedGroupId,
        buyer: req.user._id,
        action: 'reward_used',
        details: `Reward applied to order ${orderId} (Value: ${appliedRewardValue})`
      });
    }

    // Notify Admin Dashboard
    if (req.io) {
      req.io.to('admin_dashboard').emit('new_order', {
        orderId: order.orderId,
        value: order.value,
        createdAt: order.createdAt,
        buyer: order.buyer
      });
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/confirm  — manufacturer accepts order, reserved stock deducted
router.patch('/:id/confirm', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, manufacturer: req.user._id }).populate('products.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.status === 'Confirmed') {
      return res.json(order);
    }
    
    if (order.status && order.status.toLowerCase() !== 'new') {
      return res.status(400).json({ message: `Order can only be confirmed from New status (Current: ${order.status})` });
    }

    // Ensure we do not confirm if out of stock
    for (const item of order.products) {
      if (item.product && item.product.stock < item.quantity && !item.product.isActive) {
        return res.status(400).json({ message: `Insufficient stock for product ${item.product.name} (Need: ${item.quantity}, Have: ${item.product.stock})` });
      }
    }

    order.status = 'Confirmed';
    order.products.forEach(p => p.product = p.product._id); // revert population
    await order.save();

    // Create notification for buyer
    await Notification.create({
      user: order.buyer.ref,
      title: 'Order Confirmed',
      message: `Manufacturer ${req.user.company} has confirmed your order ${order.orderId}.`,
      type: 'order_confirmed',
      refModel: 'Order',
      refId: order._id,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/reject — manufacturer rejects order with reason
router.patch('/:id/reject', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Rejection reason is mandatory' });

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, manufacturer: req.user._id, status: 'New' },
      { status: 'Rejected', rejectionReason: reason },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found or already processed' });

    await Notification.create({
      user: order.buyer.ref,
      title: 'Order Rejected',
      message: `Manufacturer ${req.user.company} has rejected your order ${order.orderId}. Reason: ${reason}`,
      type: 'order_rejected',
      refModel: 'Order',
      refId: order._id,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/pack — manufacturer marks as packed
router.patch('/:id/pack', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, manufacturer: req.user._id, status: 'Confirmed' },
      { status: 'Packed' },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found or not confirmed' });

    // Also update shipment if it exists or trigger creation
    await Shipment.findOneAndUpdate(
      { order: order._id },
      { status: 'Packed', packedDate: new Date() },
      { upsert: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/dispatch — manufacturer marks as shipped
router.patch('/:id/dispatch', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { carrier, trackingNumber, lorryReceiptUrl, invoiceUrl } = req.body;
    
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, manufacturer: req.user._id, status: { $in: ['Packed', 'Confirmed', 'In Production'] } },
      { status: 'Shipped' },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found or not ready for dispatch (must be Confirmed, In Production, or Packed)' });

    // Deduct stock and record logs at dispatch perfectly according to spec
    for (const item of order.products) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
        await StockLog.create({
          product: item.product,
          manufacturer: req.user._id,
          change: -item.quantity,
          reason: 'Order Dispatched',
          reference: order.orderId
        });
      }
    }

    const shipment = await Shipment.findOneAndUpdate(
      { order: order._id },
      { 
        status: 'In Transit',
        carrier,
        trackingNumber,
        lorryReceiptUrl,
        invoiceUrl,
        dispatchDate: new Date(),
        shipmentId: `SHP-${Date.now().toString().slice(-6)}`,
        manufacturer: req.user._id,
        transportType: 'courier',
        origin: req.user.location ?? 'Manufacturer Warehouse',
        destination: order.buyer.location ?? 'Buyer Warehouse'
      },
      { upsert: true, new: true }
    );

    await Notification.create({
      user: order.buyer.ref,
      title: 'Order Dispatched',
      message: `Your order ${order.orderId} has been dispatched via ${carrier}. Tracking: ${trackingNumber}`,
      type: 'order_shipped',
      refModel: 'Shipment',
      refId: shipment._id,
    });

    res.json({ order, shipment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/delivered — buyer confirms delivery
router.patch('/:id/delivered', protect, requireRole('buyer'), async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, 'buyer.ref': req.user._id, status: 'Shipped' },
      { status: 'Delivered', deliveredAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found or not shipped' });

    // Trigger Escrow Release (Simulated: Update Settlement status)
    await Settlement.findOneAndUpdate(
      { order: order._id },
      { status: 'COMPLETED' },
      { upsert: true }
    );

    await Notification.create({
      user: order.manufacturer,
      title: 'Order Delivered',
      message: `Buyer has confirmed delivery for order ${order.orderId}. Payment released.`,
      type: 'order_delivered',
      refModel: 'Order',
      refId: order._id,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy generic status update (keep for compatibility if needed, but restrict)
router.patch('/:id/status', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, manufacturer: req.user._id },
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
