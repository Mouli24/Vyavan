import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { NotificationService } from '../services/notificationService.js';
import { PaymentTermsService } from '../services/paymentTermsService.js';

/**
 * Initializes all scheduled jobs for the Credit & Payment terms system.
 */
export const initPaymentJobs = () => {
  // Job 1 & 2 & 3: Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running daily payment processing jobs...');
    try {
      await runPreDueReminders();
      await runOverdueProcessing();
      await runDailyManufacturerSummaries();
    } catch (error) {
      console.error('[CRON ERROR] Global failure in daily jobs:', error);
    }
  });
};

/**
 * Job 1: Pre-Due Reminder (2 days before)
 */
async function runPreDueReminders() {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 2);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const records = await prisma.orderPaymentRecord.findMany({
    where: {
      due_date: { gte: targetDate, lt: nextDay },
      status: { in: ['pending', 'partial'] }
    },
    include: {
      order: {
        include: {
          buyer: { include: { user_id: true } } // This user_id is the Postgres UUID shell
        }
      }
    }
  });

  for (const record of records) {
    try {
      // Check for dedup
      const existing = await prisma.paymentRemindersLog.findFirst({
        where: {
          order_payment_record_id: record.id,
          reminder_type: 'pre_due',
          sent_at: { gte: new Date(new Date().setHours(0,0,0,0)) }
        }
      });
      if (existing) continue;

      // Fetch buyer details from shell table
      const buyerUser = await prisma.user.findUnique({ where: { id: record.order.buyer.user_id } });
      if (!buyerUser) continue;

      await NotificationService.sendPreDueReminder(
        buyerUser.email, 
        record.order_id, 
        Number(record.amount_due), 
        record.due_date!
      );

      await prisma.paymentRemindersLog.create({
        data: {
          order_payment_record_id: record.id,
          reminder_type: 'pre_due',
          channel: 'email'
        }
      });
    } catch (err) {
      console.error(`[CRON] Failed Job 1 for record ${record.id}:`, err);
    }
  }
}

/**
 * Job 2: Overdue Processing & Reminders
 */
async function runOverdueProcessing() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await prisma.orderPaymentRecord.findMany({
    where: {
      due_date: { lt: today },
      status: { in: ['pending', 'partial', 'overdue'] }
    },
    include: {
      order: {
        include: {
          manufacturer: true,
          buyer: true
        }
      }
    }
  });

  for (const record of records) {
    try {
      const diffTime = Math.abs(today.getTime() - record.due_date!.getTime());
      const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Fetch users
      const buyerUser = await prisma.user.findUnique({ where: { id: record.order.buyer.user_id } });
      const mfrUser = await prisma.user.findUnique({ where: { id: record.order.manufacturer.user_id } });

      // Day 1 Logic: Update status and Flag Buyer
      if (daysOverdue === 1) {
        if (record.status !== 'overdue') {
          await prisma.orderPaymentRecord.update({
            where: { id: record.id },
            data: { status: 'overdue' }
          });
          await PaymentTermsService.flagBuyer(record.order.buyer_id, record.order.manufacturer_id);
          
          if (mfrUser && buyerUser) {
            await NotificationService.sendManufacturerNotification(
              mfrUser.email, 
              buyerUser.name, 
              record.order_id, 
              Number(record.amount_due), 
              1
            );
          }
        }
      }

      // Reminders Logic: Days 1, 3, 7
      const reminderTypes: Record<number, string> = { 1: 'day1', 3: 'day3', 7: 'day7' };
      const type = reminderTypes[daysOverdue];

      if (type && buyerUser) {
        // Dedup
        const existing = await prisma.paymentRemindersLog.findFirst({
          where: {
            order_payment_record_id: record.id,
            reminder_type: type as any,
            sent_at: { gte: new Date(new Date().setHours(0,0,0,0)) }
          }
        });

        if (!existing) {
          await NotificationService.sendOverdueReminder(
            buyerUser.email, 
            record.order_id, 
            Number(record.amount_due), 
            daysOverdue
          );

          await prisma.paymentRemindersLog.create({
            data: {
              order_payment_record_id: record.id,
              reminder_type: type as any,
              channel: 'email'
            }
          });
        }
      }
    } catch (err) {
      console.error(`[CRON] Failed Job 2 for record ${record.id}:`, err);
    }
  }
}

/**
 * Job 3: Daily Summary for Manufacturers
 */
async function runDailyManufacturerSummaries() {
  const overdueRecords = await prisma.orderPaymentRecord.findMany({
    where: { status: 'overdue' },
    include: { order: { include: { manufacturer: true } } }
  });

  const mfrGroups: Record<string, { count: number, total: number, email: string }> = {};

  for (const record of overdueRecords) {
    const mfrId = record.order.manufacturer_id;
    if (!mfrGroups[mfrId]) {
      const user = await prisma.user.findUnique({ where: { id: record.order.manufacturer.user_id } });
      if (!user) continue;
      mfrGroups[mfrId] = { count: 0, total: 0, email: user.email };
    }
    mfrGroups[mfrId].count += 1;
    mfrGroups[mfrId].total += Number(record.amount_due);
  }

  for (const mfrId in mfrGroups) {
    try {
      const group = mfrGroups[mfrId];
      await NotificationService.sendManufacturerDailySummary(group.email, group.count, group.total);
    } catch (err) {
      console.error(`[CRON] Failed Job 3 for manufacturer ${mfrId}:`, err);
    }
  }
}
