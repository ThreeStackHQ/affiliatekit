import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { affiliates } from './affiliates'
import { programs } from './programs'

export const clicks = pgTable('clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  affiliateId: uuid('affiliate_id')
    .notNull()
    .references(() => affiliates.id, { onDelete: 'cascade' }),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id, { onDelete: 'cascade' }),
  ipAddr: text('ip_addr'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  converted: boolean('converted').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Click = typeof clicks.$inferSelect
export type NewClick = typeof clicks.$inferInsert
