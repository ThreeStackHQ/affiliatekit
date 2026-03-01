import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, PLANS } from '@/lib/stripe'
import { db, subscriptions, users } from '@affiliatekit/db'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as { plan?: string }
  const planKey = body.plan === 'pro' ? 'pro' : 'indie'
  const plan = PLANS[planKey]

  const userEmail = session.user.email

  // Look up user in DB to get userId and existing stripeCustomerId
  const dbUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, userEmail))
    .limit(1)

  const foundUser = dbUser[0]

  if (!foundUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const userId = foundUser.id

  // Check for existing Stripe customer ID
  const existingSub = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  const customerId = existingSub[0]?.stripeCustomerId ?? undefined

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/billing?success=true`,
    cancel_url: `${baseUrl}/dashboard/billing`,
    customer: customerId,
    customer_email: customerId ? undefined : userEmail,
    metadata: {
      userId,
      plan: planKey,
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
