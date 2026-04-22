import cron from 'node-cron';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import ManufacturerProfile from '../models/ManufacturerProfile.js';

export const initReviewScheduler = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running Review Reminder Cron Job...');
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      
      // Find orders delivered 48h+ ago that haven't been reviewed or notified
      const orders = await Order.find({
        status: 'Delivered',
        deliveredAt: { $lte: fortyEightHoursAgo },
        isReviewed: false,
        reviewReminderSent: false
      }).populate('manufacturer', 'name company');

      for (const order of orders) {
        // Create notification for buyer
        await Notification.create({
          user: order.buyer.ref,
          type: 'system',
          title: `Rate your experience with ${order.manufacturer.company || order.manufacturer.name}`,
          message: `Your order ${order.orderId} was delivered 48 hours ago. How was your experience? Rate now to help others!`,
          link: `/buyer/orders` // Redirect to orders list where "Rate" button exists
        });

        order.reviewReminderSent = true;
        await order.save();
        console.log(`✅ Review reminder sent for order ${order.orderId}`);
      }
    } catch (err) {
      console.error('[CRON_ERROR] Failed to process review reminders:', err);
    }
  });
};
