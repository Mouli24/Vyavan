import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import Cart from '../models/Cart.js';

const router = Router();

// GET /api/cart — Get current user's cart
router.get('/', protect, requireRole('buyer'), async (req, res) => {
  try {
    let cart = await Cart.findOne({ buyer: req.user._id }).populate({
      path: 'items.product',
      populate: { path: 'manufacturer', select: 'name company' }
    });
    
    if (!cart) {
      cart = await Cart.create({ buyer: req.user._id, items: [] });
    }
    
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cart/add — Add or increment an item
router.post('/add', protect, requireRole('buyer'), async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let cart = await Cart.findOne({ buyer: req.user._id });
    
    if (!cart) {
      cart = new Cart({ buyer: req.user._id, items: [{ product: productId, quantity }] });
    } else {
      const existing = cart.items.find(item => item.product.toString() === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
    }
    
    await cart.save();
    
    const popCart = await Cart.populate(cart, {
      path: 'items.product',
      populate: { path: 'manufacturer', select: 'name company' }
    });
    res.json(popCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/cart/update — Update quantity or exact list
router.patch('/update', protect, requireRole('buyer'), async (req, res) => {
  try {
    // Allows sending full `items` array to override cart
    const { items } = req.body;
    let cart = await Cart.findOne({ buyer: req.user._id });
    
    if (!cart) {
      cart = new Cart({ buyer: req.user._id, items: items || [] });
    } else {
      cart.items = items;
    }
    
    await cart.save();
    const popCart = await Cart.populate(cart, {
      path: 'items.product',
      populate: { path: 'manufacturer', select: 'name company' }
    });
    res.json(popCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cart/clear — Empty the cart (used post-checkout)
router.delete('/clear', protect, requireRole('buyer'), async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { buyer: req.user._id },
      { items: [] },
      { new: true }
    );
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
