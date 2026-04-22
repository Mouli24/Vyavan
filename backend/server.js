import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import http from 'http';
import { Server } from 'socket.io';

// Route imports
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import shipmentRoutes from './routes/shipments.js';
import dealRoutes from './routes/deals.js';
import messageRoutes from './routes/messages.js';
import complaintRoutes from './routes/complaints.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import scheduleRoutes from './routes/schedule.js';
import companiesRoutes from './routes/companies.js';
import manufacturerRoutes from './routes/manufacturer.js';
import cartRoutes from './routes/cart.js';
import kycRoutes from './routes/kyc.js';
import communicationRoutes from './routes/communication.js';
import addressRoutes from './routes/addresses.js';
import manufacturerPaymentRoutes from './routes/manufacturerPayment.js';
import productListerRoutes from './routes/productLister.js';
import seedRoutes from './routes/seed.js';
import aiRoutes from './routes/ai.js';
import creditTermsRoutes from './routes/creditTerms.js';

import negotiationRoutes from './routes/negotiation.js'; 
import { initPaymentJobs } from './jobs/paymentJobs.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

// ── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.includes('vercel.app') ||
      origin.includes('netlify.app');

    if (isAllowed || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    } else {
      return callback(new Error('CORS Not Allowed'), false);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join_negotiation', (negotiationId) => {
    socket.join(negotiationId);
  });
  socket.on('leave_negotiation', (negotiationId) => {
    socket.leave(negotiationId);
  });
});

// Attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/manufacturer', manufacturerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/manufacturer/payment', manufacturerPaymentRoutes);
app.use('/api/product-lister', productListerRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/credit-terms', creditTermsRoutes);

app.use('/api/negotiation', negotiationRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  version: '2.1.0-fixed',
  timestamp: new Date().toISOString(),
}));

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.stack ?? err.message);
  res.status(err.status ?? 500).json({ message: err.message ?? 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 5000;
connectDB().then(() => {
  initPaymentJobs();
  server.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
});
