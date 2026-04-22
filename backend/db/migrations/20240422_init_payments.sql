-- Migration: Initialize Credit & Payment Terms
-- Created: 2024-04-22

-- 1. Create Enum Types
CREATE TYPE "PaymentTerm" AS ENUM ('advance_100', 'split_50_50', 'net_15', 'net_30');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'partial', 'paid', 'overdue');
CREATE TYPE "PaymentMethod" AS ENUM ('manual', 'bank_transfer', 'upi', 'cheque');
CREATE TYPE "ReminderType" AS ENUM ('pre_due', 'day1', 'day3', 'day7', 'custom');
CREATE TYPE "ReminderChannel" AS ENUM ('email', 'sms', 'whatsapp');

-- 2. Create Parent Tables (Shells for Foreign Keys)
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "role" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "manufacturers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "buyers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "orders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- 3. Create Core Feature Tables

-- manufacturer_payment_settings
CREATE TABLE "manufacturer_payment_settings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "manufacturer_id" UUID UNIQUE NOT NULL REFERENCES "manufacturers"("id") ON DELETE CASCADE,
    "allowed_terms" JSONB NOT NULL,
    "default_terms" "PaymentTerm" NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- buyer_payment_terms
CREATE TABLE "buyer_payment_terms" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "manufacturer_id" UUID NOT NULL REFERENCES "manufacturers"("id") ON DELETE CASCADE,
    "buyer_id" UUID NOT NULL REFERENCES "buyers"("id") ON DELETE CASCADE,
    "allowed_terms" JSONB NOT NULL,
    "credit_limit" DECIMAL(12,2) NOT NULL,
    "is_flagged" BOOLEAN DEFAULT FALSE,
    "flagged_at" TIMESTAMP WITH TIME ZONE,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("manufacturer_id", "buyer_id")
);

-- order_payment_records
CREATE TABLE "order_payment_records" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "payment_term" "PaymentTerm" NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "amount_paid" DECIMAL(12,2) DEFAULT 0,
    "amount_due" DECIMAL(12,2) NOT NULL,
    "due_date" DATE,
    "status" "PaymentStatus" NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- payment_transactions
CREATE TABLE "payment_transactions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_payment_record_id" UUID NOT NULL REFERENCES "order_payment_records"("id") ON DELETE CASCADE,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "marked_by" UUID NOT NULL REFERENCES "users"("id"),
    "transaction_ref" TEXT,
    "payment_date" DATE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- payment_reminders_log
CREATE TABLE "payment_reminders_log" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_payment_record_id" UUID NOT NULL REFERENCES "order_payment_records"("id") ON DELETE CASCADE,
    "reminder_type" "ReminderType" NOT NULL,
    "sent_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "channel" "ReminderChannel" NOT NULL
);

-- 4. Create Indexes
CREATE INDEX "idx_manufacturer_settings_mfr" ON "manufacturer_payment_settings"("manufacturer_id");
CREATE INDEX "idx_buyer_terms_mfr" ON "buyer_payment_terms"("manufacturer_id");
CREATE INDEX "idx_buyer_terms_buyer" ON "buyer_payment_terms"("buyer_id");
CREATE INDEX "idx_order_records_order" ON "order_payment_records"("order_id");
CREATE INDEX "idx_order_records_status" ON "order_payment_records"("status");
CREATE INDEX "idx_order_records_due_date" ON "order_payment_records"("due_date");
