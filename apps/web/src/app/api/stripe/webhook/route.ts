import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@affiliatekit/db'
import { affiliates, conversions, programs, settings, subscriptions } from '@affiliatekit/db'
import { eq, and } from 'drizzle-orm'
import { decrypt } from '@/lib/crypto'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// POST /api/stripe/webhook — handles conversion tracking AND subscription lifecycle
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event | null = null

  // Try global billing webhook secret first
  const globalSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (globalSecret) {
    try {
      const stripe = getStripe()
      event = stripe.webhooks.constructEvent(body, sig, globalSecret)
    } catch {
      // Try per-user secrets below
    }
  }

  if (!event) {
    // Try per-user encrypted webhook secrets (for per-program Stripe accounts)
    const userSettings = await db.select().from(settings)

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
          apiVersion: '2026-02-25.acacia' as Stripe.LatestApiVersion,
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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Billing checkout (has userId metadata and plan)
        if (session.metadata?.userId && session.metadata?.plan) {
          await handleBillingCheckoutCompleted(session)
        } else {
          // Conversion tracking checkout
          await handleConversionCheckoutCompleted(session)
        }
        break
      }
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as Stripe.Charge)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
    }
  } catch (error) {
    console.error('[stripe/webhook] Handler error:', error)
    // Return 200 to prevent Stripe from retrying on app-level errors
  }

  return NextResponse.json({ received: true })
}

// ─── Billing Subscription Handlers ────────────────────────────────────────

async function handleBillingCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const plan = session.metadata?.plan as 'indie' | 'pro' | undefined

  if (!userId || !plan) return

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null
  const customerId = typeof session.customer === 'string' ? session.customer : null

  if (!subscriptionId) return

  const stripe = getStripe()
  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)

  // In Stripe v20+, current_period_end lives on the SubscriptionItem, not the root
  const periodEndTs = stripeSub.items.data[0]?.current_period_end ?? 0
  const periodEnd = periodEndTs > 0 ? new Date(periodEndTs * 1000) : null

  await db
    .insert(subscriptions)
    .values({
      userId,
      tier: plan,
      status: stripeSub.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      currentPeriodEnd: periodEnd,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        tier: plan,
        status: stripeSub.status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      },
    })
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : null
  if (!customerId) return

  // In Stripe v20+, current_period_end lives on SubscriptionItem
  const periodEndTs = stripeSub.items.data[0]?.current_period_end ?? 0
  const periodEnd = periodEndTs > 0 ? new Date(periodEndTs * 1000) : null

  await db
    .update(subscriptions)
    .set({
      status: stripeSub.status,
      currentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId))
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : null
  if (!customerId) return

  const periodEndTs = stripeSub.items.data[0]?.current_period_end ?? 0
  const periodEnd = periodEndTs > 0 ? new Date(periodEndTs * 1000) : null

  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      tier: 'free',
      currentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId))
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
  if (!customerId) return

  await db
    .update(subscriptions)
    .set({ status: 'past_due', updatedAt: new Date() })
    .where(eq(subscriptions.stripeCustomerId, customerId))
}

// ─── Conversion Tracking Handlers ─────────────────────────────────────────

async function handleConversionCheckoutCompleted(session: Stripe.Checkout.Session) {
  const refCode =
    session.metadata?.ak_ref ??
    session.client_reference_id ??
    null

  if (!refCode) return

  const [row] = await db
    .select({ affiliate: affiliates, program: programs })
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
      : commissionRate * 100
  )

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

  await db
    .update(affiliates)
    .set({ totalConversions: row.affiliate.totalConversions + 1 })
    .where(eq(affiliates.id, row.affiliate.id))
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  const refCode = charge.metadata?.ak_ref ?? null
  if (!refCode) return

  const [row] = await db
    .select({ affiliate: affiliates, program: programs })
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
