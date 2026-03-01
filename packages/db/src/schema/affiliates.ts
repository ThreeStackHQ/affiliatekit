import { pgTable, uuid, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'
import { programs } from './programs'

export const affiliateStatusEnum = pgEnum('affiliate_status', ['pending', 'active', 'banned'])

export const affiliates = pgTable('affiliates', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  affiliateCode: text('affiliate_code').notNull().unique(),
  status: affiliateStatusEnum('status').notNull().default('pending'),
  totalClicks: integer('total_clicks').notNull().default(0),
  totalConversions: integer('total_conversions').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Affiliate = typeof affiliates.$inferSelect
export type NewAffiliate = typeof affiliates.$inferInsert
