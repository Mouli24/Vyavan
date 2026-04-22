import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/products  — public, browseable by buyers
router.get('/', async (req, res) => {
  try {
    const { category, manufacturer } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (manufacturer) filter.manufacturer = manufacturer;
    const products = await Product.find(filter)
      .populate('manufacturer', 'name company location manufacturerStatus');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/mine  — manufacturer's own products
router.get('/mine', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const products = await Product.find({ manufacturer: req.user._id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('manufacturer', 'name company location manufacturerStatus');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products  — manufacturer only
router.post('/', protect, requireRole('manufacturer'), [
  body('name').notEmpty(),
  body('price').isNumeric(),
  body('moq').isNumeric(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const product = await Product.create({ ...req.body, manufacturer: req.user._id });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/products/:id  — manufacturer only (own products)
router.patch('/:id', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, manufacturer: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found or not yours' });
    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products/:id  — manufacturer only
router.delete('/:id', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, manufacturer: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found or not yours' });

    // Check if product is registered in any active orders
    const activeOrders = await Order.countDocuments({
      'products.product': product._id,
      status: { $in: ['New', 'Confirmed', 'In Production', 'Packed', 'Shipped'] },
    });

    if (activeOrders > 0) {
      // Soft delete if orders exist to preserve history
      product.isActive = false;
      await product.save();
      return res.status(400).json({ 
        message: 'Cannot delete product with active orders. Mark as inactive instead.',
        softDeleted: true 
      });
    }

    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
