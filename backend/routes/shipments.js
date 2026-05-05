import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

// ── GET /api/shipments/my — buyer or manufacturer sees shipments for their orders ─────────────
router.get('/my', protect, requireRole('buyer', 'manufacturer'), async (req, res) => {
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

// ── GET /api/shipments/ai-plan — AI Shipment Planner ───────────────────────────
router.get('/ai-plan', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const confirmed = await Order.find({
      manufacturer: req.user._id,
      status: 'Confirmed',
    }).populate('buyer.ref', 'name company');

    if (confirmed.length === 0) {
      return res.status(400).json({ message: 'No pending confirmed orders to plan.' });
    }

    const pending_orders = confirmed.map(o => {
      // Stub weight/volume: approx 1kg per ₹100 of value
      const valueInr = o.valueRaw || 0;
      const computedWeight = Math.max(10, Math.round(valueInr / 100));
      const computedVolume = Math.max(1, Math.round(computedWeight / 20));

      return {
        order_id: o.orderId,
        buyer_name: o.buyer?.name || 'Unknown',
        delivery_city: o.deliveryAddress?.city || 'Unknown',
        delivery_state: o.deliveryAddress?.state || 'Unknown',
        delivery_pincode: o.deliveryAddress?.pincode || 'Unknown',
        total_weight_kg: computedWeight,
        total_volume_cubic_feet: computedVolume,
        order_value_inr: valueInr,
        order_confirmed_date: o.updatedAt || o.createdAt,
        buyer_priority: true // Assuming all are repeat/urgent for MVP stub
      };
    });

    const mfrLocation = req.user.location || req.user.company || 'Unknown Address';

    const inputData = {
      manufacturer_location: mfrLocation,
      pending_orders
    };

    const prompt = `
You are a Shipment Planning AI Agent for a B2B manufacturing platform. Your job is to help manufacturers optimize their order dispatch by analyzing pending orders and suggesting the most efficient shipment plan.

You will receive a JSON object containing:
- manufacturer_location: The manufacturer's factory/warehouse city and state
- pending_orders: A list of confirmed orders that have not yet been shipped, each containing:
  - order_id
  - buyer_name
  - delivery_city
  - delivery_state
  - delivery_pincode
  - total_weight_kg
  - total_volume_cubic_feet
  - order_value_inr
  - order_confirmed_date
  - buyer_priority (repeat_buyer: true/false)

Your job is to analyze all pending orders and return a structured shipment plan.

RULES YOU MUST FOLLOW:

1. Group orders going to the same city or within 50km radius into one combined shipment wherever possible.

2. For each group suggest the most suitable transport mode based on:
   - Weight and volume of combined orders
   - Distance from manufacturer location to delivery city
   - Order value (high value = safer transport mode)
   - Use "own_vehicle" if total weight is under 500kg and distance is under 200km
   - Use "transport_company" if weight is above 500kg or distance is above 200km
   - Use "bus_cargo" if weight is under 100kg and distance is under 500km
   - Use "train_parcel" if distance is above 500km and weight is manageable

3. Estimate cost savings when combining orders vs sending separately. Use these rough per-km rates:
   - own_vehicle: ₹12/km
   - transport_company: ₹8/km (but minimum ₹1500 per trip)
   - bus_cargo: ₹6/kg flat
   - train_parcel: ₹4/kg flat

4. Prioritize repeat buyers and high value orders — suggest dispatching these first.

5. Flag any order that has been confirmed for more than 3 days and not yet shipped — mark as URGENT.

6. Suggest optimal dispatch timing — morning dispatches (before 10am) reach faster for nearby cities, overnight transport for distant cities.

7. If manufacturer has provided available vehicles in input, factor that in. If no vehicle data provided, suggest based on order size only.

RESPONSE FORMAT:
Return ONLY a valid JSON object. No extra text. No markdown. No explanation outside JSON.

Response structure:
{
  "summary": {
    "total_pending_orders": number,
    "total_shipment_groups": number,
    "estimated_total_savings_inr": number,
    "urgent_orders": ["order_id", ...]
  },
  "shipment_groups": [
    {
      "group_id": "SG-001",
      "orders_included": ["order_id", ...],
      "delivery_area": "city name or area description",
      "combined_weight_kg": number,
      "suggested_transport": "own_vehicle / transport_company / bus_cargo / train_parcel",
      "estimated_cost_inr": number,
      "savings_vs_separate_inr": number,
      "suggested_dispatch_time": "Morning before 10AM / Evening after 5PM / Overnight",
      "estimated_delivery_date": "approximate date or days",
      "priority": "high / medium / low",
      "reason": "short explanation of why this grouping and transport was chosen"
    }
  ],
  "individual_shipments": [
    {
      "order_id": "string",
      "reason_not_grouped": "too far / different direction / urgent solo dispatch needed",
      "suggested_transport": "string",
      "estimated_cost_inr": number,
      "suggested_dispatch_time": "string",
      "estimated_delivery_date": "string",
      "priority": "high / medium / low"
    }
  ],
  "agent_notes": "Any overall recommendation the manufacturer should know — max 2 sentences."
}

INPUT DATA:
${JSON.stringify(inputData, null, 2)}
`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-key', { apiVersion: 'v1' });
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    // Explicitly enforce structured output using generationConfig
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    const text = response.text();
    
    const parsedPlan = JSON.parse(text);
    res.json(parsedPlan);
  } catch (error) {
    console.error('[AI_PLAN_ERROR]', error);
    res.status(500).json({ message: 'Failed to generate shipment plan.', error: error.message });
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
