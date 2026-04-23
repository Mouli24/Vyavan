import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js';
import Order from '../models/Order.js';
import SystemFlag from '../models/SystemFlag.js';
import ManufacturerProfile from '../models/ManufacturerProfile.js';
import BuyerProfile from '../models/BuyerProfile.js';
import mongoose from 'mongoose';

export const runFraudDetection = async () => {
  const flagsCreated = [];

  // 1. Same IP multiple accounts
  const ipGroups = await UserActivity.aggregate([
    { $match: { action: 'LOGIN' } },
    { $group: { _id: '$ipAddress', users: { $addToSet: '$user' } } },
    { $match: { 'users.1': { $exists: true } } } // At least 2 users
  ]);

  for (const group of ipGroups) {
    if (!group._id) continue;
    const existing = await SystemFlag.findOne({ flagType: 'DUPLICATE_IP', 'evidence.ipAddress': group._id, status: 'active' });
    if (!existing) {
      const f = await SystemFlag.create({
        flagType: 'DUPLICATE_IP',
        severity: 'Medium',
        involvedUsers: group.users,
        evidence: {
          ipAddress: group._id,
          description: `Multiple users (${group.users.length}) logging in from the same IP address.`
        }
      });
      flagsCreated.push(f);
    }
  }

  // 2. High Cancellations (3+ in 7 days)
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const cancels = await Order.aggregate([
    { $match: { status: 'Cancelled', createdAt: { $gte: last7Days } } },
    { $group: { _id: '$buyer.ref', count: { $sum: 1 } } },
    { $match: { count: { $gte: 3 } } }
  ]);

  for (const c of cancels) {
    const existing = await SystemFlag.findOne({ flagType: 'HIGH_CANCELLATION', subjectUser: c._id, status: 'active' });
    if (!existing) {
      const f = await SystemFlag.create({
        flagType: 'HIGH_CANCELLATION',
        severity: 'High',
        subjectUser: c._id,
        evidence: {
          orderCount: c.count,
          description: `User cancelled ${c.count} orders in the last 7 days.`
        }
      });
      flagsCreated.push(f);
    }
  }

  // 3. Large First Order (> ₹5L)
  const fiveLakhs = 500000;
  // Get users who only have 1 order
  const firstOrders = await Order.aggregate([
     { $group: { _id: '$buyer.ref', count: { $sum: 1 }, firstOrderValue: { $first: '$valueRaw' } } },
     { $match: { count: 1, firstOrderValue: { $gt: fiveLakhs } } }
  ]);
  
  for (const fo of firstOrders) {
    const existing = await SystemFlag.findOne({ flagType: 'LARGE_FIRST_ORDER', subjectUser: fo._id, status: 'active' });
    if (!existing) {
       await SystemFlag.create({
          flagType: 'LARGE_FIRST_ORDER',
          severity: 'High',
          subjectUser: fo._id,
          evidence: {
             value: fo.firstOrderValue,
             description: `Initial order value exceeding ₹5,00,000 threshold.`
          }
       });
    }
  }

  // 4. Non-Dispatch (Confirmed for 5+ days)
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const stuckOrders = await Order.find({ status: 'Confirmed', updatedAt: { $lte: fiveDaysAgo } });
  
  const mfrGroups = {};
  stuckOrders.forEach(o => {
     mfrGroups[o.manufacturer] = (mfrGroups[o.manufacturer] || 0) + 1;
  });

  for (const mfrId in mfrGroups) {
     if (mfrGroups[mfrId] >= 3) {
        const existing = await SystemFlag.findOne({ flagType: 'NON_DISPATCH', subjectUser: mfrId, status: 'active' });
        if (!existing) {
           await SystemFlag.create({
              flagType: 'NON_DISPATCH',
              severity: 'Medium',
              subjectUser: mfrId,
              evidence: {
                 orderCount: mfrGroups[mfrId],
                 description: `${mfrGroups[mfrId]} orders stuck in 'Confirmed' status for over 5 days.`
              }
           });
        }
     }
  }

  return flagsCreated;
};
