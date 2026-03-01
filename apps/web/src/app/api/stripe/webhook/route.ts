import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, PLANS } from '@/lib/stripe'
import { db, subscriptions } from '@affiliatekit/db'
import { eq } from 'drizzle-orm'
import { appTierToDbTier } from '@/lib/tier'
import type { AppTier } from '@/lib/tier'

export const dynamic = 'force-dynamic'

function priceIdToPlanTier(priceId: string): AppTier {
  if (priceId === PLANS.pro.priceId) return 'pro'
  if (priceId === PLANS.indie.priceId) return 'indie'
  return 'free'
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[webhook] signature verification failed:', message)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null

        let appTier: AppTier = 'free'
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = sub.items.data[0]?.price.id ?? ''
          appTier = priceIdToPlanTier(priceId)
        }

        const dbTier = appTierToDbTier(appTier)

        await db
          .insert(subscriptions)
          .values({
            userId,
            tier: dbTier,
            status: 'active',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          })
          .onConflictDoUpdate({
            target: subscriptions.userId,
            set: {
              tier: dbTier,
              status: 'active',
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              updatedAt: new Date(),
            },
          })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id ?? ''
        const appTier = priceIdToPlanTier(priceId)
        const dbTier = appTierToDbTier(appTier)
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        // Find user by stripe customer id
        const existing = await db
          .select({ userId: subscriptions.userId })
          .from(subscriptions)
          .where(eq(subscriptions.stripeCustomerId, customerId))
          .limit(1)

        if (existing.length > 0) {
          // current_period_end is on SubscriptionItem in Stripe API >= 2024
          const periodEndTs = sub.items.data[0]?.current_period_end
          await db
            .update(subscriptions)
            .set({
              tier: dbTier,
              status: sub.status,
              stripeSubscriptionId: sub.id,
              ...(periodEndTs != null
                ? { currentPeriodEnd: new Date(periodEndTs * 1000) }
                : {}),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeCustomerId, customerId))
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        await db
          .update(subscriptions)
          .set({
            tier: 'free',
            status: 'canceled',
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId))
        break
      }

      default:
        // Unhandled event — ignore
        break
    }
  } catch (err) {
    console.error('[webhook] handler error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
