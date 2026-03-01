import { pgTable, uuid, text, timestamp, numeric, pgEnum, integer } from 'drizzle-orm/pg-core'
import { affiliates } from './affiliates'
import { programs } from './programs'

export const conversionStatusEnum = pgEnum('conversion_status', ['pending', 'approved', 'paid'])

export const conversions = pgTable('conversions', {
  id: uuid('id').primaryKey().defaultRandom(),
  affiliateId: uuid('affiliate_id')
    .notNull()
    .references(() => affiliates.id, { onDelete: 'cascade' }),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id, { onDelete: 'cascade' }),
  orderId: text('order_id').notNull(),
  // Stripe-specific fields
  stripeCustomerId: text('stripe_customer_id'),
  stripeChargeId: text('stripe_charge_id'),
  // Amount in cents
  amountCents: integer('amount_cents').notNull().default(0),
  commissionCents: integer('commission_cents').notNull().default(0),
  // Legacy decimal fields (kept for backward compat)
  orderAmount: numeric('order_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  status: conversionStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Conversion = typeof conversions.$inferSelect
export type NewConversion = typeof conversions.$inferInsert
