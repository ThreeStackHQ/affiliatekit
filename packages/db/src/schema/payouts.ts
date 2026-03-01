import { pgTable, uuid, text, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core'
import { affiliates } from './affiliates'
import { programs } from './programs'

export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'processing', 'paid'])
export const payoutMethodEnum = pgEnum('payout_method', ['paypal', 'bank', 'manual'])

export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id, { onDelete: 'cascade' }),
  affiliateId: uuid('affiliate_id')
    .notNull()
    .references(() => affiliates.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  method: payoutMethodEnum('method').notNull().default('manual'),
  status: payoutStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Payout = typeof payouts.$inferSelect
export type NewPayout = typeof payouts.$inferInsert
