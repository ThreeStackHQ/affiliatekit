import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.acacia' as Stripe.LatestApiVersion,
      typescript: true,
    })
  }
  return _stripe
}

export const PLANS = {
  indie: {
    name: 'Indie',
    priceId: process.env.STRIPE_INDIE_PRICE_ID ?? '',
    price: 9,
    programLimit: 3,
    affiliateLimit: 100,
    conversionsPerMonth: Infinity,
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
    price: 29,
    programLimit: Infinity,
    affiliateLimit: Infinity,
    conversionsPerMonth: Infinity,
  },
} as const

export type PlanKey = keyof typeof PLANS
