-- AffiliateKit Initial Schema Migration

CREATE TYPE "commission_type" AS ENUM ('percentage', 'fixed');
CREATE TYPE "affiliate_status" AS ENUM ('pending', 'active', 'banned');
CREATE TYPE "conversion_status" AS ENUM ('pending', 'approved', 'paid');
CREATE TYPE "payout_status" AS ENUM ('pending', 'processing', 'paid');
CREATE TYPE "subscription_tier" AS ENUM ('free', 'pro', 'business');

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "image" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "programs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "commission_type" "commission_type" NOT NULL DEFAULT 'percentage',
  "commission_value" numeric(10, 2) NOT NULL DEFAULT 10,
  "cookie_days" integer NOT NULL DEFAULT 30,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "affiliates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "program_id" uuid NOT NULL REFERENCES "programs"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "affiliate_code" text NOT NULL UNIQUE,
  "status" "affiliate_status" NOT NULL DEFAULT 'pending',
  "total_clicks" integer NOT NULL DEFAULT 0,
  "total_conversions" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "clicks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "affiliate_id" uuid NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE,
  "program_id" uuid NOT NULL REFERENCES "programs"("id") ON DELETE CASCADE,
  "ip_addr" text,
  "user_agent" text,
  "referrer" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "conversions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "affiliate_id" uuid NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE,
  "program_id" uuid NOT NULL REFERENCES "programs"("id") ON DELETE CASCADE,
  "order_id" text NOT NULL,
  "order_amount" numeric(10, 2) NOT NULL,
  "commission_amount" numeric(10, 2) NOT NULL,
  "status" "conversion_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payouts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "affiliate_id" uuid NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE,
  "amount" numeric(10, 2) NOT NULL,
  "status" "payout_status" NOT NULL DEFAULT 'pending',
  "payout_method" text,
  "payout_reference" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "paid_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "tier" "subscription_tier" NOT NULL DEFAULT 'free',
  "status" text NOT NULL DEFAULT 'active',
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "current_period_end" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX "programs_user_id_idx" ON "programs"("user_id");
CREATE INDEX "affiliates_program_id_idx" ON "affiliates"("program_id");
CREATE INDEX "clicks_affiliate_id_idx" ON "clicks"("affiliate_id");
CREATE INDEX "clicks_program_id_idx" ON "clicks"("program_id");
CREATE INDEX "clicks_created_at_idx" ON "clicks"("created_at");
CREATE INDEX "conversions_affiliate_id_idx" ON "conversions"("affiliate_id");
CREATE INDEX "conversions_program_id_idx" ON "conversions"("program_id");
CREATE INDEX "payouts_affiliate_id_idx" ON "payouts"("affiliate_id");
