import { z } from 'zod';

const ValidPaymentTerms = z.enum(["advance_100", "split_50_50", "net_15", "net_30"]);

export const PaymentSettingsSchema = z.object({
  allowed_terms: z.array(ValidPaymentTerms).nonempty(),
  default_terms: ValidPaymentTerms
});

export const BuyerTermsSchema = z.object({
  allowed_terms: z.array(ValidPaymentTerms).nonempty(),
  credit_limit: z.number().min(0),
  notes: z.string().optional()
});

export const AvailableTermsQuerySchema = z.object({
  buyer_id: z.string(),
  manufacturer_id: z.string(),
  order_amount: z.string().transform((val) => parseFloat(val)),
});

export const ReceivablesQuerySchema = z.object({
  status: z.enum(['pending', 'partial', 'paid', 'overdue', 'all']).optional().default('all'),
  buyer_id: z.string().optional(),
  sort: z.string().optional().default('due_date')
});

export const MarkPaidSchema = z.object({
  amount: z.number().positive(),
  payment_method: z.enum(['manual', 'bank_transfer', 'upi', 'cheque']),
  transaction_ref: z.string().nullable().optional(),
  payment_date: z.string().transform((val) => new Date(val))
});

export const RemindersLogQuerySchema = z.object({
  buyer_id: z.string().optional(),
  from_date: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  to_date: z.string().optional().transform((val) => val ? new Date(val) : undefined)
});
