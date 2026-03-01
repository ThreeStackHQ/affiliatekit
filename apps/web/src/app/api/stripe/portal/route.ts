import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { db, subscriptions, users } from '@affiliatekit/db'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userEmail = session.user.email

  // Resolve DB user
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

  // Get Stripe customer ID from subscription record
  const sub = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  const stripeCustomerId = sub[0]?.stripeCustomerId

  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${baseUrl}/dashboard/billing`,
  })

  return NextResponse.redirect(portalSession.url)
}
