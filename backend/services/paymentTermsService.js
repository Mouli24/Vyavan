import prisma from '../config/prisma.js';

/**
 * Service for managing Credit and Payment Terms business logic.
 */
export class PaymentTermsService {
  
  /**
   * Function 1: getAvailableTerms
   * Determines which payment terms are available for a specific buyer-manufacturer pair.
   */
  static async getAvailableTerms(manufacturerId, buyerId, newOrderAmount) {
    if (!manufacturerId || !buyerId || newOrderAmount < 0) {
      throw new Error('Invalid input: manufacturerId, buyerId and non-negative newOrderAmount are required.');
    }

    // 1. Fetch buyer-specific terms
    let buyerTerms = await prisma.buyerPaymentTerms.findUnique({
      where: { manufacturer_id_buyer_id: { manufacturer_id: manufacturerId, buyer_id: buyerId } }
    });

    let allowedTerms;
    let creditLimit = 0;
    let isFlagged = false;

    if (buyerTerms) {
      allowedTerms = buyerTerms.allowed_terms;
      creditLimit = buyerTerms.credit_limit;
      isFlagged = buyerTerms.is_flagged;
    } else {
      // Fallback to manufacturer defaults
      const mfrSettings = await prisma.manufacturerPaymentSettings.findUnique({
        where: { manufacturer_id: manufacturerId }
      });
      if (!mfrSettings) throw new Error('Manufacturer payment settings not found.');
      allowedTerms = mfrSettings.allowed_terms;
    }

    // 2. Calculate current outstanding
    const outstandingData = await prisma.orderPaymentRecord.aggregate({
      where: {
        order: { buyer_id: buyerId, manufacturer_id: manufacturerId }, 
        status: { in: ['pending', 'partial', 'overdue'] }
      },
      _sum: { amount_due: true }
    });
    
    const outstanding = outstandingData._sum.amount_due || 0;

    // 3. Check Flags
    if (isFlagged) {
      return { terms: ['advance_100'], restricted: true, reason: 'overdue_flag' };
    }

    // 4. Check Credit Limit
    const totalPotentialDebt = Number(outstanding) + Number(newOrderAmount);
    if (totalPotentialDebt > Number(creditLimit) && Number(creditLimit) > 0) {
      return { terms: ['advance_100'], restricted: true, reason: 'credit_limit' };
    }

    return { terms: allowedTerms, restricted: false };
  }

  /**
   * Function 2: calculateDueDate
   * Calculates the due date based on the payment term and order date.
   */
  static calculateDueDate(paymentTerm, orderDate) {
    if (!orderDate) throw new Error('Order date is required.');
    
    const date = new Date(orderDate);
    switch (paymentTerm) {
      case 'advance_100':
        return null;
      case 'split_50_50':
      case 'net_15':
        date.setDate(date.getDate() + 15);
        return date;
      case 'net_30':
        date.setDate(date.getDate() + 30);
        return date;
      default:
        throw new Error(`Invalid payment term: ${paymentTerm}`);
    }
  }

  /**
   * Function 3: createOrderPaymentRecord
   * Creates a new payment record for an order.
   */
  static async createOrderPaymentRecord(orderId, paymentTerm, totalAmount, orderDate) {
    if (!orderId || totalAmount <= 0) throw new Error('Invalid order metadata or amount.');

    const dueDate = this.calculateDueDate(paymentTerm, orderDate);
    
    let amountDue = totalAmount;
    if (paymentTerm === 'split_50_50') {
      amountDue = totalAmount / 2;
    }

    return await prisma.orderPaymentRecord.create({
      data: {
        order_id: orderId,
        payment_term: paymentTerm,
        total_amount: totalAmount,
        amount_due: amountDue,
        due_date: dueDate,
        status: 'pending'
      }
    });
  }

  /**
   * Function 4: recordPayment
   * Records a transaction and updates the order payment record.
   */
  static async recordPayment(
    orderPaymentRecordId, 
    amount, 
    method, 
    transactionRef, 
    paymentDate, 
    markedBy
  ) {
    if (amount <= 0) throw new Error('Payment amount must be positive.');

    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.create({
        data: {
          order_payment_record_id: orderPaymentRecordId,
          amount: amount,
          payment_method: method,
          marked_by_id: markedBy,
          transaction_ref: transactionRef,
          payment_date: paymentDate
        }
      });

      const record = await tx.orderPaymentRecord.findUnique({
        where: { id: orderPaymentRecordId },
        include: { order: true }
      });
      if (!record) throw new Error('Order payment record not found.');

      const currentPaid = Number(record.amount_paid);
      const currentDue = Number(record.amount_due);

      const newAmountPaid = currentPaid + Number(amount);
      const newAmountDue = currentDue - Number(amount);
      const newStatus = newAmountDue <= 0 ? 'paid' : 'partial';

      const updatedRecord = await tx.orderPaymentRecord.update({
        where: { id: orderPaymentRecordId },
        data: {
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          status: newStatus
        }
      });

      return { transaction, updatedRecord };
    });
  }

  /**
   * Function 5: checkAndUnflagBuyer
   * Checks if a buyer has any outstanding debt and unflags them if clear.
   */
  static async checkAndUnflagBuyer(buyerId, manufacturerId) {
    const outstandingCount = await prisma.orderPaymentRecord.count({
      where: {
        order: { buyer_id: buyerId, manufacturer_id: manufacturerId },
        status: { in: ['pending', 'partial', 'overdue'] }
      }
    });

    if (outstandingCount === 0) {
      await prisma.buyerPaymentTerms.update({
        where: { manufacturer_id_buyer_id: { manufacturer_id: manufacturerId, buyer_id: buyerId } },
        data: { is_flagged: false, flagged_at: null }
      });
    }
  }

  /**
   * Function 6: flagBuyer
   * Manually flags a buyer.
   */
  static async flagBuyer(buyerId, manufacturerId) {
    return await prisma.buyerPaymentTerms.update({
      where: { manufacturer_id_buyer_id: { manufacturer_id: manufacturerId, buyer_id: buyerId } },
      data: { is_flagged: true, flagged_at: new Date() }
    });
  }

  /**
   * Function 7: getReceivables
   * Fetches receivables for a manufacturer with filters.
   */
  static async getReceivables(manufacturerId, filters) {
    const where = {
      order: { manufacturer_id: manufacturerId }
    };

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    if (filters.buyerId) {
      where.order = { ...where.order, buyer_id: filters.buyerId };
    }

    const records = await prisma.orderPaymentRecord.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            buyer_id: true,
          }
        }
      },
      orderBy: filters.sortBy ? { [filters.sortBy]: 'asc' } : { due_date: 'asc' }
    });

    return records.map(r => {
      const today = new Date();
      const dueDate = r.due_date ? new Date(r.due_date) : null;
      let daysOverdue = 0;
      if (dueDate && dueDate < today && r.status !== 'paid') {
        const diffTime = Math.abs(today.getTime() - dueDate.getTime());
        daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        order_id: r.order_id,
        amount_due: r.amount_due,
        due_date: r.due_date,
        days_overdue: daysOverdue,
        status: r.status,
      };
    });
  }
}
