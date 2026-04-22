import { Router } from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import ManufacturerProfile from '../models/ManufacturerProfile.js';
import Notification from '../models/Notification.js';
import { protect, requireRole } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = Router();

/**
 * @desc Get all reviews for a manufacturer storefront
 */
router.get('/manufacturer/:id', async (req, res) => {
  try {
    const reviews = await Review.find({ manufacturer: req.params.id })
      .populate('buyer', 'name location')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc Create a new review
 */
router.post('/', protect, requireRole('buyer'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orderId, ratings, comment, images } = req.body;

    // 1. Verify order
    const order = await Order.findOne({ 
      _id: orderId, 
      'buyer.ref': req.user._id,
      status: 'Delivered',
      isReviewed: false 
    }).session(session);

    if (!order) {
      throw new Error('Order not found, not delivered, or already reviewed.');
    }

    // 2. Calculate overall
    const overall = (ratings.quality + ratings.delivery + ratings.communication) / 3;

    // 3. Create review
    const review = await Review.create([{
      order: orderId,
      buyer: req.user._id,
      manufacturer: order.manufacturer,
      ratings: { ...ratings, overall },
      comment,
      images
    }], { session });

    // 4. Update order
    order.isReviewed = true;
    order.review = review[0]._id;
    await order.save({ session });

    // 5. Update Manufacturer Stats
    const mfrProfile = await ManufacturerProfile.findOne({ user: order.manufacturer }).session(session);
    if (mfrProfile) {
      const allReviews = await Review.find({ manufacturer: order.manufacturer }).session(session);
      const count = allReviews.length;
      
      const sumOverall = allReviews.reduce((acc, r) => acc + r.ratings.overall, 0);
      const sumQuality = allReviews.reduce((acc, r) => acc + r.ratings.quality, 0);
      const sumDelivery = allReviews.reduce((acc, r) => acc + r.ratings.delivery, 0);
      const sumComm = allReviews.reduce((acc, r) => acc + r.ratings.communication, 0);

      mfrProfile.stats.avgRating = sumOverall / count;
      mfrProfile.stats.avgQuality = sumQuality / count;
      mfrProfile.stats.avgDelivery = sumDelivery / count;
      mfrProfile.stats.avgCommunication = sumComm / count;
      mfrProfile.stats.totalReviews = count;

      await mfrProfile.save({ session });
    }

    // 6. Anti-fraud check
    const recentReviewsFromSameBuyer = await Review.find({
      buyer: req.user._id,
      manufacturer: order.manufacturer
    }).sort({ createdAt: -1 }).limit(5).session(session);

    if (recentReviewsFromSameBuyer.length >= 3) {
      const allFiveStars = recentReviewsFromSameBuyer.every(r => r.ratings.overall === 5);
      if (allFiveStars) {
        review[0].isFlagged = true;
        review[0].flagReason = 'Potential suspicious pattern: Multiple consecutive 5-star reviews from same buyer.';
        await review[0].save({ session });
        
        // Notify Admin (optional, but flagged in DB is key)
        console.warn(`[FRAUD_ALERT] Suspicious review pattern detected for Manufacturer ${order.manufacturer}`);
      }
    }

    // 7. Notify Manufacturer
    await Notification.create([{
      user: order.manufacturer,
      type: 'system',
      title: 'New Review Received',
      message: `You received a ${overall.toFixed(1)} star review for order ${order.orderId}.`,
      link: `/manufacturer/orders` // Or storefront link
    }], { session });

    await session.commitTransaction();
    res.status(201).json(review[0]);
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

/**
 * @desc Edit a review (within 24h)
 */
router.patch('/:id', protect, requireRole('buyer'), async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    // Check 24h window
    const now = new Date();
    const created = new Date(review.createdAt);
    const diffHours = (now - created) / (1000 * 60 * 60);

    if (diffHours > 24) {
      return res.status(403).json({ message: 'The 24-hour edit window has closed.' });
    }

    const { ratings, comment, images } = req.body;
    if (ratings) {
      const overall = (ratings.quality + ratings.delivery + ratings.communication) / 3;
      review.ratings = { ...ratings, overall };
    }
    if (comment !== undefined) review.comment = comment;
    if (images) review.images = images;
    
    review.isEdited = true;
    await review.save();

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc Manufacturer reply to a review
 */
router.patch('/:id/reply', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Reply text is required.' });

    const review = await Review.findOne({ _id: req.params.id, manufacturer: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    if (review.manufacturerReply?.text) {
      return res.status(400).json({ message: 'You have already replied to this review.' });
    }

    review.manufacturerReply = {
      text,
      repliedAt: new Date()
    };

    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
