import { Router, Request, Response } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { PaymentTermsService } from '../services/paymentTermsService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  PaymentSettingsSchema,
  BuyerTermsSchema,
  AvailableTermsQuerySchema,
  ReceivablesQuerySchema,
  MarkPaidSchema,
  RemindersLogQuerySchema
} from '../validators/creditTermsValidator.js';
import prisma from '../config/prisma.js';

const router = Router();

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

/**
 * Ensures a manufacturer record exists in Postgres for a given MongoDB User ID.
 * Returns the Postgres UUID for the manufacturer.
 */
async function getOrCreateManufacturer(userId: string): Promise<string> {
  let mfr = await prisma.manufacturer.findFirst({ where: { user_id: userId } });
  if (!mfr) {
    mfr = await prisma.manufacturer.create({ data: { user_id: userId } });
  }
  return mfr.id;
}

/**
 * Ensures a buyer record exists in Postgres for a given MongoDB User ID.
 */
async function getOrCreateBuyer(userId: string): Promise<string> {
  let buyer = await prisma.buyer.findFirst({ where: { user_id: userId } });
  if (!buyer) {
    buyer = await prisma.buyer.create({ data: { user_id: userId } });
  }
  return buyer.id;
}

// -----------------------------------------------------------------------------
// ROUTES
// -----------------------------------------------------------------------------

// 1. GET /api/credit-terms/manufacturers/:id/payment-settings
router.get('/manufacturers/:id/payment-settings', protect, requireRole('manufacturer', 'admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    // Auth check: Manufacturer can only see their own settings
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return errorResponse(res, 'Unauthorized access', 'FORBIDDEN', 403);
    }

    const mfrId = await getOrCreateManufacturer(userId);
    const settings = await prisma.manufacturerPaymentSettings.findUnique({
      where: { manufacturer_id: mfrId }
    });

    return successResponse(res, settings || { allowed_terms: [], default_terms: 'advance_100' });
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
});

// 2. PUT /api/credit-terms/manufacturers/:id/payment-settings
router.put('/manufacturers/:id/payment-settings', protect, requireRole('manufacturer', 'admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return errorResponse(res, 'Unauthorized access', 'FORBIDDEN', 403);
    }

    const validated = PaymentSettingsSchema.parse(req.body);
    const mfrId = await getOrCreateManufacturer(userId);

    const settings = await prisma.manufacturerPaymentSettings.upsert({
      where: { manufacturer_id: mfrId },
      update: {
        allowed_terms: validated.allowed_terms,
        default_terms: validated.default_terms as any
      },
      create: {
        manufacturer_id: mfrId,
        allowed_terms: validated.allowed_terms,
        default_terms: validated.default_terms as any
      }
    });

    return successResponse(res, settings);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, err.errors[0].message, 'VALIDATION_ERROR', 400);
    return errorResponse(res, err.message);
  }
});

// 3. GET /api/credit-terms/manufacturers/:mfr_id/buyers/:buyer_id/terms
router.get('/manufacturers/:mfr_id/buyers/:buyer_id/terms', protect, requireRole('manufacturer', 'admin'), async (req: Request, res: Response) => {
  try {
    const mfrUserId = req.params.mfr_id;
    const buyerUserId = req.params.buyer_id;

    if (req.user.role !== 'admin' && req.user._id.toString() !== mfrUserId) {
      return errorResponse(res, 'Unauthorized access', 'FORBIDDEN', 403);
    }

    const mfrId = await getOrCreateManufacturer(mfrUserId);
    const buyerId = await getOrCreateBuyer(buyerUserId);

    const terms = await prisma.buyerPaymentTerms.findUnique({
      where: { manufacturer_id_buyer_id: { manufacturer_id: mfrId, buyer_id: buyerId } }
    });

    // Also get outstanding balance
    const outstandingData = await prisma.orderPaymentRecord.aggregate({
      where: {
        order: { buyer_id: buyerId, manufacturer_id: mfrId },
        status: { in: ['pending', 'partial', 'overdue'] }
      },
      _sum: { amount_due: true }
    });

    return successResponse(res, {
      ...(terms || { allowed_terms: [], credit_limit: 0, is_flagged: false, notes: '' }),
      outstanding_balance: outstandingData._sum.amount_due || 0
    });
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
});

// 4. PUT /api/credit-terms/manufacturers/:mfr_id/buyers/:buyer_id/terms
router.put('/manufacturers/:mfr_id/buyers/:buyer_id/terms', protect, requireRole('manufacturer', 'admin'), async (req: Request, res: Response) => {
  try {
    const mfrUserId = req.params.mfr_id;
    const buyerUserId = req.params.buyer_id;

    if (req.user.role !== 'admin' && req.user._id.toString() !== mfrUserId) {
      return errorResponse(res, 'Unauthorized access', 'FORBIDDEN', 403);
    }

    const validated = BuyerTermsSchema.parse(req.body);
    const mfrId = await getOrCreateManufacturer(mfrUserId);
    const buyerId = await getOrCreateBuyer(buyerUserId);

    const terms = await prisma.buyerPaymentTerms.upsert({
      where: { manufacturer_id_buyer_id: { manufacturer_id: mfrId, buyer_id: buyerId } },
      update: {
        allowed_terms: validated.allowed_terms,
        credit_limit: validated.credit_limit,
        notes: validated.notes
      },
      create: {
        manufacturer_id: mfrId,
        buyer_id: buyerId,
        allowed_terms: validated.allowed_terms,
        credit_limit: validated.credit_limit,
        notes: validated.notes
      }
    });

    return successResponse(res, terms);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, err.errors[0].message, 'VALIDATION_ERROR', 400);
    return errorResponse(res, err.message);
  }
});

// 5. DELETE /api/credit-terms/manufacturers/:mfr_id/buyers/:buyer_id/terms
router.delete('/manufacturers/:mfr_id/buyers/:buyer_id/terms', protect, requireRole('manufacturer', 'admin'), async (req: Request, res: Response) => {
  try {
    const mfrUserId = req.params.mfr_id;
    const buyerUserId = req.params.buyer_id;

    if (req.user.role !== 'admin' && req.user._id.toString() !== mfrUserId) {
      return errorResponse(res, 'Unauthorized access', 'FORBIDDEN', 403);
    }

    const mfrId = await getOrCreateManufacturer(mfrUserId);
    const buyerId = await getOrCreateBuyer(buyerUserId);

    await prisma.buyerPaymentTerms.delete({
      where: { manufacturer_id_buyer_id: { manufacturer_id: mfrId, buyer_id: buyerId } }
    });

    return successResponse(res, { message: 'Buyer terms reset to defaults' });
  } catch (err: any) {
    return errorResponse(res, 'No custom buyer terms found to delete or internal error.', 'NOT_FOUND', 404);
  }
});

// 6. GET /api/credit-terms/checkout/available-terms
router.get('/checkout/available-terms', protect, async (req: Request, res: Response) => {
  try {
    const query = AvailableTermsQuerySchema.parse(req.query);
    
    // Auth: User must be the buyer or manufacturer in the query
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== query.buyer_id && 
        req.user._id.toString() !== query.manufacturer_id) {
      return errorResponse(res, 'Unauthorized to view these terms', 'FORBIDDEN', 403);
    }

    const mfrId = await getOrCreateManufacturer(query.manufacturer_id);
    const buyerId = await getOrCreateBuyer(query.buyer_id);

    const result = await PaymentTermsService.getAvailableTerms(mfrId, buyerId, query.order_amount);
    return successResponse(res, {
      available_terms: result.terms,
      restricted: result.restricted,
      reason: result.reason
    });
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, err.errors[0].message, 'VALIDATION_ERROR', 400);
    return errorResponse(res, err.message);
  }
});

// 7. GET /api/credit-terms/manufacturers/:id/receivables
router.get('/manufacturers/:id/receivables', protect, requireRole('manufacturer', 'admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return errorResponse(res, 'Unauthorized access', 'FORBIDDEN', 403);
    }

    const query = ReceivablesQuerySchema.parse(req.query);
    const mfrId = await getOrCreateManufacturer(userId);

    const receivables = await PaymentTermsService.getReceivables(mfrId, query);

    // Calculate summary totals
    const totalDue = receivables.reduce((sum, r) => sum + Number(r.amount_due), 0);
    const overdueCount = receivables.filter(r => r.status === 'overdue' || (r.days_overdue && r.days_overdue > 0)).length;

    return successResponse(res, {
      list: receivables,
      summary: {
        total_amount_due: totalDue,
        overdue_count: overdueCount
      }
    });
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, err.errors[0].message, 'VALIDATION_ERROR', 400);
    return errorResponse(res, err.message);
  }
});

// 8. POST /api/credit-terms/payment-records/:id/mark-paid
router.post('/payment-records/:id/mark-paid', protect, requireRole('manufacturer', 'admin'), async (req: Request, res: Response) => {
  try {
    const recordId = req.params.id;
    const validated = MarkPaidSchema.parse(req.body);

    // In a real app, check if the record belongs to the req.user's manufacturer profile
    const result = await PaymentTermsService.recordPayment(
      recordId,
      validated.amount,
      validated.payment_method,
      validated.transaction_ref || null,
      validated.payment_date,
      req.user._id.toString()
    );

    return successResponse(res, result.updatedRecord);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, err.errors[0].message, 'VALIDATION_ERROR', 400);
    return errorResponse(res, err.message);
  }
});

// 9. POST /api/credit-terms/payment-records/:id/send-reminder
router.post('/payment-records/:id/send-reminder', protect, requireRole('manufacturer', 'admin'), async (req: Request, res: Response) => {
  try {
    const recordId = req.params.id;
    
    // Log reminder to DB
    const log = await prisma.paymentRemindersLog.create({
      data: {
        order_payment_record_id: recordId,
        reminder_type: 'custom',
        channel: 'email' // Default to email for Phase 3
      }
    });

    // In real app, trigger actual email service here

    return successResponse(res, { sent: true, channel: 'email', log_id: log.id });
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
});

// 10. GET /api/credit-terms/manufacturers/:id/reminders-log
router.get('/manufacturers/:id/reminders-log', protect, requireRole('manufacturer', 'admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return errorResponse(res, 'Unauthorized access', 'FORBIDDEN', 403);
    }

    const query = RemindersLogQuerySchema.parse(req.query);
    const mfrId = await getOrCreateManufacturer(userId);

    const logs = await prisma.paymentRemindersLog.findMany({
      where: {
        order_payment_record: {
          order: { manufacturer_id: mfrId }
        }
      },
      orderBy: { sent_at: 'desc' }
    });

    return successResponse(res, logs);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, err.errors[0].message, 'VALIDATION_ERROR', 400);
    return errorResponse(res, err.message);
  }
});

export default router;
