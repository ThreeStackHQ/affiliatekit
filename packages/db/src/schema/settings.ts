import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  // AES-256-GCM encrypted Stripe webhook secret
  stripeWebhookSecretEnc: text('stripe_webhook_secret_enc'),
  // iv:authTag:ciphertext (base64 encoded parts)
  stripeWebhookSecretIv: text('stripe_webhook_secret_iv'),
  stripeWebhookSecretTag: text('stripe_webhook_secret_tag'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Settings = typeof settings.$inferSelect
export type NewSettings = typeof settings.$inferInsert
