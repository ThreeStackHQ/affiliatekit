import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/session'
import { getStripe, PLANS, type PlanKey } from '@/lib/stripe'
import { db } from '@affiliatekit/db'
import { subscriptions } from '@affiliatekit/db'
import { eq } from 'drizzle-orm'

const CheckoutSchema = z.object({
  plan: z.enum(['indie', 'pro']),
  // Optional: affiliate ref code to credit if this checkout converts
  affiliateCode: z.string().max(32).optional(),
})

// POST /api/stripe/checkout — create billing checkout session
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

  const parsed = CheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 })
  }

  const { plan, affiliateCode } = parsed.data
  const planConfig = PLANS[plan as PlanKey]

  if (!planConfig.priceId) {
    return NextResponse.json(
      { error: `Price ID for ${plan} plan is not configured` },
      { status: 500 }
    )
  }

  // Also check for affiliate code from cookie header if not in body
  const cookieHeader = req.headers.get('cookie') ?? ''
  const cookieAffRef =
    cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('aff_ref=') || c.startsWith('ak_ref='))
      ?.split('=')[1] ?? null

  const resolvedAffCode = affiliateCode ?? cookieAffRef ?? null

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    // Check for existing Stripe customer ID
    const [existingSub] = await db
      .select({ stripeCustomerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1)

    let customerId = existingSub?.stripeCustomerId ?? undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      customerId = customer.id
    }

    // Build metadata — include affiliate ref if present for conversion crediting
    const metadata: Record<string, string> = {
      userId: user.id,
      plan,
    }
    if (resolvedAffCode) {
      metadata.ak_ref = resolvedAffCode
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=1&plan=${plan}`,
      cancel_url: `${appUrl}/billing`,
      // Pass affiliate ref as client_reference_id for webhook lookup
      ...(resolvedAffCode ? { client_reference_id: resolvedAffCode } : {}),
      metadata,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[POST /api/stripe/checkout]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
