import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export const PLANS = {
  indie: {
    priceId: process.env.STRIPE_PRICE_INDIE!,
    name: 'Indie',
    price: 9,
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO!,
    name: 'Pro',
    price: 29,
  },
} as const

export type PlanKey = keyof typeof PLANS
