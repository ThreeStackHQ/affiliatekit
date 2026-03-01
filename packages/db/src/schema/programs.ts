import { pgTable, uuid, text, timestamp, boolean, numeric, integer, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const commissionTypeEnum = pgEnum('commission_type', ['percentage', 'fixed'])

export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  commissionType: commissionTypeEnum('commission_type').notNull().default('percentage'),
  commissionValue: numeric('commission_value', { precision: 10, scale: 2 }).notNull().default('10'),
  cookieDays: integer('cookie_days').notNull().default(30),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Program = typeof programs.$inferSelect
export type NewProgram = typeof programs.$inferInsert
