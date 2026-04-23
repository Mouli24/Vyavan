import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import BuyerGroup from '../models/BuyerGroup.js';
import BuyerGroupMember from '../models/BuyerGroupMember.js';
import BuyerGroupLog from '../models/BuyerGroupLog.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = Router();

/**
 * @desc Get the "Buyer Pool" — all buyers who have interacted with this manufacturer
 */
router.get('/pool', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const mfrId = req.user._id;

    // 1. Find all unique buyers from orders placed with this manufacturer
    const buyerStats = await Order.aggregate([
      { $match: { manufacturer: new mongoose.Types.ObjectId(mfrId) } },
      { $group: {
          _id: "$buyer.ref",
          totalOrders: { $sum: 1 },
          lastOrderDate: { $max: "$createdAt" },
          totalSpent: { $sum: "$valueRaw" }
      }}
    ]);

    // 2. Fetch user details for these buyers
    const buyerIds = buyerStats.map(s => s._id);
    const buyers = await User.find({ _id: { $in: buyerIds } })
      .select('name email lastLogin createdAt');

    // 3. Find current group memberships for these buyers with this manufacturer
    const memberships = await BuyerGroupMember.find({ 
      manufacturer: mfrId, 
      buyer: { $in: buyerIds } 
    }).populate('group', 'name');

    // 4. Merge data
    const pool = buyers.map(buyer => {
      const stats = buyerStats.find(s => s._id.toString() === buyer._id.toString());
      const membership = memberships.find(m => m.buyer.toString() === buyer._id.toString());
      
      return {
        _id: buyer._id,
        name: buyer.name,
        email: buyer.email,
        lastLogin: buyer.lastLogin,
        accountAgeMonths: Math.floor((new Date() - new Date(buyer.createdAt)) / (1000 * 60 * 60 * 24 * 30)),
        totalOrders: stats?.totalOrders || 0,
        totalSpent: stats?.totalSpent || 0,
        lastOrderDate: stats?.lastOrderDate,
        currentGroup: membership ? { id: membership.group._id, name: membership.group.name } : null
      };
    });

    res.json(pool);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc Create a new buyer group
 */
router.post('/', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { name, description, rewardType, rewardValue } = req.body;
    const group = await BuyerGroup.create({
      name,
      description,
      rewardType,
      rewardValue,
      manufacturer: req.user._id
    });

    await BuyerGroupLog.create({
       manufacturer: req.user._id,
       buyer: req.user._id, // Manufacturer as actor
       group: group._id,
       type: 'group_created',
       description: `Created group ${name}`
    });

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc Get all groups for manufacturer
 */
router.get('/', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const groups = await BuyerGroup.find({ manufacturer: req.user._id });
    
    // Enrich with member counts
    const enrichedGroups = await Promise.all(groups.map(async (g) => {
       const count = await BuyerGroupMember.countDocuments({ group: g._id });
       return { ...g.toObject(), memberCount: count };
    }));

    res.json(enrichedGroups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc Bulk add buyers to a group
 */
router.post('/members/add', protect, requireRole('manufacturer'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { groupId, buyerIds } = req.body;
    const mfrId = req.user._id;

    const group = await BuyerGroup.findOne({ _id: groupId, manufacturer: mfrId });
    if (!group) throw new Error('Group not found');

    for (const buyerId of buyerIds) {
      // Remove from any existing group for this manufacturer (Single group rule)
      await BuyerGroupMember.deleteMany({ manufacturer: mfrId, buyer: buyerId }).session(session);
      
      // Add to new group
      await BuyerGroupMember.create([{
        group: groupId,
        buyer: buyerId,
        manufacturer: mfrId
      }], { session });

      await BuyerGroupLog.create([{
        manufacturer: mfrId,
        buyer: buyerId,
        group: groupId,
        type: 'member_added',
        description: `Added to group ${group.name}`
      }], { session });
    }

    await session.commitTransaction();
    res.json({ message: `Successfully added ${buyerIds.length} members to ${group.name}` });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

/**
 * @desc Remove buyer from group
 */
router.delete('/members/remove', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { buyerId } = req.body;
    const mfrId = req.user._id;

    const membership = await BuyerGroupMember.findOne({ manufacturer: mfrId, buyer: buyerId }).populate('group');
    if (!membership) return res.status(404).json({ message: 'Buyer not in any group' });

    await BuyerGroupLog.create({
      manufacturer: mfrId,
      buyer: buyerId,
      group: membership.group._id,
      type: 'member_removed',
      description: `Removed from group ${membership.group.name}`
    });

    await BuyerGroupMember.deleteOne({ _id: membership._id });
    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc (Buyer side) Get all rewards for the current buyer across all manufacturers
 */
router.get('/my-rewards', protect, async (req, res) => {
  try {
    const buyerId = req.user._id;

    const memberships = await BuyerGroupMember.find({ buyer: buyerId })
      .populate('group')
      .populate('manufacturer', 'name company');

    const rewards = memberships.map(m => ({
      manufacturer: m.manufacturer,
      groupName: m.group.name,
      rewardType: m.group.rewardType,
      rewardValue: m.group.rewardValue,
      joinedAt: m.joinedAt
    }));

    res.json(rewards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc (Buyer side) Check if the current buyer has a reward for this manufacturer
 */
router.get('/check/:manufacturerId', protect, async (req, res) => {
  try {
    const { manufacturerId } = req.params;
    const buyerId = req.user._id;

    const membership = await BuyerGroupMember.findOne({ 
      manufacturer: manufacturerId, 
      buyer: buyerId 
    }).populate('group');

    if (!membership || !membership.group || !membership.group.isActive) {
      return res.json({ hasReward: false });
    }

    res.json({
      hasReward: true,
      groupId: membership.group._id,
      groupName: membership.group.name,
      rewardType: membership.group.rewardType,
      rewardValue: membership.group.rewardValue
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
