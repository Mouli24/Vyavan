import { Router } from 'express';
import Message from '../models/Message.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// GET /api/messages?deal=<dealId>  — messages for a deal thread
router.get('/', protect, async (req, res) => {
  try {
    const { deal } = req.query;
    if (!deal) return res.status(400).json({ message: 'deal query param required' });
    const messages = await Message.find({ deal })
      .populate('sender', 'name role avatar')
      .populate('product', 'name price unit image')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages  — send a message in a deal thread
router.post('/', protect, async (req, res) => {
  try {
    const { deal, content, type, product } = req.body;
    const message = await Message.create({
      deal,
      sender: req.user._id,
      senderRole: req.user.role,
      content,
      type: type ?? 'text',
      product,
    });
    await message.populate('sender', 'name role avatar');
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
