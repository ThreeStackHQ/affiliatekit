import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@affiliatekit/db'
import { settings } from '@affiliatekit/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { encrypt } from '@/lib/crypto'

const SaveStripeSecretSchema = z.object({
  webhookSecret: z.string().min(10).startsWith('whsec_', {
    message: 'Must be a valid Stripe webhook secret starting with whsec_',
  }),
})

// POST /api/settings/stripe — save SaaS owner's Stripe webhook secret (AES-256-GCM encrypted)
export async function POST(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = SaveStripeSecretSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 })
  }

  const { webhookSecret } = parsed.data

  // Encrypt the webhook secret
  const encrypted = encrypt(webhookSecret)

  try {
    // Upsert settings for this user
    await db
      .insert(settings)
      .values({
        userId: user.id,
        stripeWebhookSecretEnc: encrypted.ciphertext,
        stripeWebhookSecretIv: encrypted.iv,
        stripeWebhookSecretTag: encrypted.authTag,
      })
      .onConflictDoUpdate({
        target: settings.userId,
        set: {
          stripeWebhookSecretEnc: encrypted.ciphertext,
          stripeWebhookSecretIv: encrypted.iv,
          stripeWebhookSecretTag: encrypted.authTag,
          updatedAt: new Date(),
        },
      })

    return NextResponse.json({ message: 'Stripe webhook secret saved successfully' })
  } catch (error) {
    console.error('[POST /api/settings/stripe]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/settings/stripe — check if secret is configured (never return the actual secret)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  const [userSettings] = await db
    .select({
      id: settings.id,
      hasWebhookSecret: settings.stripeWebhookSecretEnc,
      updatedAt: settings.updatedAt,
    })
    .from(settings)
    .where(eq(settings.userId, user.id))
    .limit(1)

  return NextResponse.json({
    configured: !!userSettings?.hasWebhookSecret,
    updatedAt: userSettings?.updatedAt ?? null,
  })
}
