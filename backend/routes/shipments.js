import { Router } from 'express';
import Shipment from '../models/Shipment.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract a city token from a location string like "Surat, Gujarat" → "surat" */
function cityToken(location = '') {
  return location.split(',')[0].trim().toLowerCase();
}

/** Build a tracking URL for known couriers */
function courierTrackingUrl(carrier = '', trackingNumber = '') {
  const map = {
    delhivery: `https://www.delhivery.com/tracking/?tracking_id=${trackingNumber}`,
    shiprocket: `https://shiprocket.co/tracking/${trackingNumber}`,
    dtdc: `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=consignment&strCnno=${trackingNumber}`,
    bluedart: `https://www.bluedart.com/tracking`,
    ekart: `https://ekartlogistics.com/shipmenttrack/${trackingNumber}`,
  };
  const key = carrier.toLowerCase().replace(/\s+/g, '');
  return map[key] || null;
}

/** Compute progress % from status */
function progressFromStatus(status) {
  const map = {
    Processing: 10, Packed: 25, Dispatched: 40, 'In Transit': 60,
    'Reached Hub': 75, 'Out for Delivery': 90, Delivered: 100, Delayed: 50,
  };
  return map[status] ?? 10;
}

// ── GET /api/shipments  — manufacturer's own shipments ───────────────────────
router.get('/', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const shipments = await Shipment.find({ manufacturer: req.user._id })
      .populate('orders', 'orderId items buyer expectedDate')
      .populate('order',  'orderId items buyer expectedDate')
      .sort({ createdAt: -1 });
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/shipments/my — buyer sees shipments for their orders ─────────────
router.get('/my', protect, requireRole('buyer'), async (req, res) => {
  try {
    const buyerOrders = await Order.find({ 'buyer.ref': req.user._id }).select('_id');
    const ids = buyerOrders.map(o => o._id);
    
    const shipments = await Shipment.find({
      $or: [
        { order: { $in: ids } },
        { orders: { $in: ids } }
      ]
    })
      .populate('orders', 'orderId items buyer expectedDate value')
      .populate('order',  'orderId items buyer expectedDate value')
      .populate('manufacturer', 'name company')
      .sort({ createdAt: -1 });
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/shipments/combine-check — detect same-city confirmed orders ──────
router.get('/combine-check', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const confirmed = await Order.find({
      manufacturer: req.user._id,
      status: 'Confirmed',
    });

    // Group by city token
    const cityMap = {};
    for (const o of confirmed) {
      const city = cityToken(o.buyer?.location || '');
      if (!city) continue;
      if (!cityMap[city]) cityMap[city] = [];
      cityMap[city].push(o);
    }

    const groups = Object.entries(cityMap)
      .filter(([, orders]) => orders.length >= 2)
      .map(([city, orders]) => ({ city, orders }));

    res.json({ groups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/shipments/:id ────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('orders', 'orderId items buyer expectedDate value')
      .populate('order',  'orderId items buyer expectedDate value')
      .populate('manufacturer', 'name company');
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/shipments/:id/track — mock courier status pull ──────────────────
router.get('/:id/track', protect, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    if (!shipment.trackingEvents || shipment.trackingEvents.length === 0) {
      const t0 = shipment.dispatchDate
        ? new Date(shipment.dispatchDate)
        : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      shipment.trackingEvents = [
        {
          status: 'Dispatched',
          location: shipment.pickupLocation || shipment.departureStation || shipment.departureBusStand || 'Origin',
          time: t0,
          message: 'Shipment has been handed over to carrier.',
        },
        {
          status: 'In Transit',
          location: 'Hub Checkpoint',
          time: new Date(t0.getTime() + 18 * 3600 * 1000),
          message: 'Package is on the way to destination city.',
        },
      ];
      await shipment.save();
    }

    res.json(shipment.trackingEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/shipments — create shipment (single or combined) ────────────────
router.post('/', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const {
      orderIds = [],        // array for combined; or single orderId
      orderId,             // single order (legacy / convenience)
      transportType,
      dispatchDate,
      estimatedDelivery,
      pickupLocation,
      destination,
      specialInstructions,
      // own_vehicle / transport_company
      driverName, driverPhone, vehicleNumber, transportCompany,
      // bus_cargo
      busServiceName, busNumber, parcelReceiptNumber, departureBusStand, destinationBusStand,
      // train_parcel
      trainName, trainNumber, parcelBookingNumber, departureStation, arrivalStation,
      // courier
      carrier, trackingNumber,
    } = req.body;

    if (!transportType) return res.status(400).json({ message: 'Transport type is required' });

    // Resolve order IDs
    const allOrderIds = orderId ? [orderId] : orderIds;
    if (!allOrderIds.length) return res.status(400).json({ message: 'At least one order is required' });

    // Verify all orders belong to this manufacturer & are Confirmed
    const orders = await Order.find({
      _id: { $in: allOrderIds },
      manufacturer: req.user._id,
      status: { $in: ['Confirmed', 'In Production', 'Packed'] },
    });
    if (orders.length !== allOrderIds.length) {
      return res.status(400).json({ message: 'One or more orders are invalid or not ready for dispatch' });
    }

    const shipmentId = `SHP-${Date.now().toString().slice(-7)}`;
    const trackingUrl = transportType === 'courier' ? courierTrackingUrl(carrier, trackingNumber) : null;
    const arrivalStr = estimatedDelivery
      ? `Est. ${new Date(estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : 'TBD';

    const shipment = await Shipment.create({
      shipmentId,
      manufacturer: req.user._id,
      orders: allOrderIds,
      order: allOrderIds[0],   // backward-compat
      transportType,
      status: 'Dispatched',
      progress: 40,
      dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date(),
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      arrival: arrivalStr,
      pickupLocation,
      destination,
      specialInstructions,
      // own / transport
      driverName, driverPhone, vehicleNumber, transportCompany,
      // bus
      busServiceName, busNumber, parcelReceiptNumber, departureBusStand, destinationBusStand,
      // train
      trainName, trainNumber, parcelBookingNumber, departureStation, arrivalStation,
      // courier
      carrier, trackingNumber, trackingUrl,
      trackingEvents: [{
        status: 'Dispatched',
        location: pickupLocation || departureStation || departureBusStand || 'Origin',
        time: dispatchDate ? new Date(dispatchDate) : new Date(),
        message: 'Shipment confirmed and dispatched by manufacturer.',
      }],
    });

    // Update all linked orders → Shipped
    await Order.updateMany({ _id: { $in: allOrderIds } }, { status: 'Shipped' });

    // Build notification message per transport type
    const notifMessage = (order) => {
      if (transportType === 'own_vehicle' || transportType === 'transport_company') {
        return `Your order ${order.orderId} is on the way! Driver: ${driverName || 'N/A'}, Vehicle: ${vehicleNumber || 'N/A'}. Est. delivery: ${arrivalStr}`;
      }
      if (transportType === 'bus_cargo') {
        return `Your order ${order.orderId} has been dispatched via ${busServiceName || 'Bus Cargo'}. Receipt: ${parcelReceiptNumber || 'N/A'}. Est. arrival: ${arrivalStr}`;
      }
      if (transportType === 'train_parcel') {
        return `Your order ${order.orderId} is travelling on ${trainName || 'Train'} (${trainNumber || ''}). Booking: ${parcelBookingNumber || 'N/A'}. Est. arrival: ${arrivalStr}`;
      }
      if (transportType === 'courier') {
        return `Your order ${order.orderId} shipped via ${carrier}. Tracking: ${trackingNumber}. Est. arrival: ${arrivalStr}`;
      }
      return `Your order ${order.orderId} has been dispatched. Est. arrival: ${arrivalStr}`;
    };

    // Notify each buyer
    for (const order of orders) {
      if (order.buyer?.ref) {
        await Notification.create({
          user: order.buyer.ref,
          type: 'order_shipped',
          title: '🚚 Order Shipped!',
          message: notifMessage(order),
          link: '/buyer/shipments',
          refModel: 'Shipment',
          refId: shipment._id,
        });
      }
    }

    res.status(201).json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/shipments/:id/status — manufacturer updates shipment status ────
router.patch('/:id/status', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { status, location, message } = req.body;
    const allowed = ['In Transit', 'Reached Hub', 'Out for Delivery', 'Delivered', 'Delayed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const shipment = await Shipment.findOne({ _id: req.params.id, manufacturer: req.user._id })
      .populate('orders', 'orderId buyer');
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    shipment.status = status;
    shipment.progress = progressFromStatus(status);
    shipment.trackingEvents.push({
      status,
      location: location || 'En route',
      time: new Date(),
      message: message || `Status updated to ${status}`,
    });
    await shipment.save();

    // If delivered → update all linked orders
    if (status === 'Delivered') {
      const orderIds = shipment.orders?.length ? shipment.orders.map(o => o._id) : [shipment.order];
      await Order.updateMany({ _id: { $in: orderIds } }, { status: 'Delivered' });
    }

    // Notify buyers
    const orderDocs = shipment.orders?.length ? shipment.orders : [];
    for (const order of orderDocs) {
      if (order.buyer?.ref) {
        await Notification.create({
          user: order.buyer.ref,
          type: 'shipment_update',
          title: `Shipment Update — ${status}`,
          message: message || `Your order ${order.orderId} is now: ${status}.`,
          link: '/buyer/shipments',
          refModel: 'Shipment',
          refId: shipment._id,
        });
      }
    }

    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/shipments/:id — generic field update (progress, arrival, etc) ─
router.patch('/:id', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndUpdate(
      { _id: req.params.id, manufacturer: req.user._id },
      req.body,
      { new: true }
    );
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/shipments/reminders/check — 24h/48h reminder logic (cron-friendly) ──
router.get('/reminders/check', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const now = Date.now();
    const h24 = new Date(now - 24 * 3600 * 1000);
    const h48 = new Date(now - 48 * 3600 * 1000);

    // Orders confirmed but no shipment created yet
    const confirmedOrders = await Order.find({
      manufacturer: req.user._id,
      status: 'Confirmed',
    });

    const results = [];
    for (const order of confirmedOrders) {
      const hasShipment = await Shipment.exists({ orders: order._id });
      if (hasShipment) continue;
      const confirmedAt = order.updatedAt || order.createdAt;
      if (confirmedAt < h48) {
        results.push({ order, level: '48h', message: `⚠️ Order ${order.orderId} confirmed 48+ hours ago — no shipment created yet!` });
      } else if (confirmedAt < h24) {
        results.push({ order, level: '24h', message: `Order ${order.orderId} confirmed 24+ hours ago — please create a shipment soon.` });
      }
    }

    res.json({ reminders: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
