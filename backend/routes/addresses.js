import { Router } from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// GET /api/addresses
// Returns the current user's addresses
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.addresses || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/addresses
// Add a new address
router.post('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newAddress = req.body;

    // If this is the first address or marked as default, unset others (if marked as default)
    if (newAddress.isDefault || user.addresses.length === 0) {
      newAddress.isDefault = true;
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(user.addresses[user.addresses.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/addresses/:id
// Update an existing address
router.patch('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    const updates = req.body;
    
    // If incoming update sets it to default, unset others
    if (updates.isDefault === true) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== req.params.id) {
          addr.isDefault = false;
        }
      });
    }

    Object.keys(updates).forEach(key => {
      address[key] = updates[key];
    });

    await user.save();
    res.json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/addresses/:id
// Delete an address
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    // Assuming order model embeds delivery address, we can safely remove from user profile
    user.addresses.pull({ _id: req.params.id });

    // If we deleted the default, set another to default if any exist
    if (address.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ message: 'Address removed successfully', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
