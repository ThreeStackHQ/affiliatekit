import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@affiliatekit/db'
import { affiliates, conversions, programs, settings, users } from '@affiliatekit/db'
import { eq, and } from 'drizzle-orm'
import { decrypt } from '@/lib/crypto'

// POST /api/stripe/webhook — Stripe signature verified
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // We try each user's stored webhook secret to find which one matches.
  // In a multi-tenant setup, you typically have a per-program webhook secret.
  // Fallback: use the global STRIPE_WEBHOOK_SECRET env var.
  let event: Stripe.Event | null = null

  const globalSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (globalSecret) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
        apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
      })
      event = stripe.webhooks.constructEvent(body, sig, globalSecret)
    } catch {
      // Try per-user secrets below
    }
  }

  if (!event) {
    // Try per-user encrypted secrets
    const userSettings = await db
      .select()
      .from(settings)
      .where(
        and(
          // Only fetch settings that have a webhook secret
          // (non-null check in Drizzle done by filtering in JS)
        )
      )

    for (const s of userSettings) {
      if (!s.stripeWebhookSecretEnc || !s.stripeWebhookSecretIv || !s.stripeWebhookSecretTag) {
        continue
      }
      try {
        const webhookSecret = decrypt({
          ciphertext: s.stripeWebhookSecretEnc,
          iv: s.stripeWebhookSecretIv,
          authTag: s.stripeWebhookSecretTag,
        })
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
          apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
        })
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
        break
      } catch {
        continue
      }
    }
  }

  if (!event) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  // Handle events
  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
    } else if (event.type === 'charge.succeeded') {
      await handleChargeSucceeded(event.data.object as Stripe.Charge)
    }
  } catch (error) {
    console.error('[stripe/webhook] Handler error:', error)
    // Return 200 to prevent Stripe from retrying
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Extract ref code from metadata or client_reference_id
  const refCode =
    session.metadata?.ak_ref ??
    session.client_reference_id ??
    null

  if (!refCode) return

  // Find affiliate by ref code
  const [row] = await db
    .select({
      affiliate: affiliates,
      program: programs,
    })
    .from(affiliates)
    .innerJoin(programs, eq(programs.id, affiliates.programId))
    .where(and(eq(affiliates.affiliateCode, refCode), eq(affiliates.status, 'active')))
    .limit(1)

  if (!row) return

  const amountTotal = session.amount_total ?? 0
  const commissionRate = parseFloat(row.program.commissionValue)
  const commissionCents = Math.round(
    row.program.commissionType === 'percentage'
      ? (amountTotal * commissionRate) / 100
      : commissionRate * 100 // fixed amount in dollars → cents
  )

  // Idempotency: check if conversion already recorded for this session
  const orderId = `checkout_${session.id}`
  const existing = await db
    .select({ id: conversions.id })
    .from(conversions)
    .where(eq(conversions.orderId, orderId))
    .limit(1)

  if (existing.length > 0) return

  await db.insert(conversions).values({
    affiliateId: row.affiliate.id,
    programId: row.program.id,
    orderId,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
    stripeChargeId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    amountCents: amountTotal,
    commissionCents,
    orderAmount: (amountTotal / 100).toFixed(2),
    commissionAmount: (commissionCents / 100).toFixed(2),
    status: 'pending',
  })

  // Update affiliate conversion count
  await db
    .update(affiliates)
    .set({ totalConversions: row.affiliate.totalConversions + 1 })
    .where(eq(affiliates.id, row.affiliate.id))
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  // Extract ref code from metadata
  const refCode = charge.metadata?.ak_ref ?? null
  if (!refCode) return

  const [row] = await db
    .select({
      affiliate: affiliates,
      program: programs,
    })
    .from(affiliates)
    .innerJoin(programs, eq(programs.id, affiliates.programId))
    .where(and(eq(affiliates.affiliateCode, refCode), eq(affiliates.status, 'active')))
    .limit(1)

  if (!row) return

  const amountCents = charge.amount ?? 0
  const commissionRate = parseFloat(row.program.commissionValue)
  const commissionCents = Math.round(
    row.program.commissionType === 'percentage'
      ? (amountCents * commissionRate) / 100
      : commissionRate * 100
  )

  const orderId = `charge_${charge.id}`
  const existing = await db
    .select({ id: conversions.id })
    .from(conversions)
    .where(eq(conversions.orderId, orderId))
    .limit(1)

  if (existing.length > 0) return

  await db.insert(conversions).values({
    affiliateId: row.affiliate.id,
    programId: row.program.id,
    orderId,
    stripeCustomerId: typeof charge.customer === 'string' ? charge.customer : null,
    stripeChargeId: charge.id,
    amountCents,
    commissionCents,
    orderAmount: (amountCents / 100).toFixed(2),
    commissionAmount: (commissionCents / 100).toFixed(2),
    status: 'pending',
  })

  await db
    .update(affiliates)
    .set({ totalConversions: row.affiliate.totalConversions + 1 })
    .where(eq(affiliates.id, row.affiliate.id))
}
