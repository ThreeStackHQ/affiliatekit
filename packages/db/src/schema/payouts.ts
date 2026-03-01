import { pgTable, uuid, text, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core'
import { affiliates } from './affiliates'

export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'processing', 'paid'])

export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  affiliateId: uuid('affiliate_id')
    .notNull()
    .references(() => affiliates.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: payoutStatusEnum('status').notNull().default('pending'),
  payoutMethod: text('payout_method'),
  payoutReference: text('payout_reference'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
})

export type Payout = typeof payouts.$inferSelect
export type NewPayout = typeof payouts.$inferInsert
