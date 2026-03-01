import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing — AffiliateKit',
  description: 'Simple, transparent pricing. Start free. Scale when you need to. No revenue cuts ever.',
}

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for getting started and validating your affiliate program.',
    cta: 'Start for Free',
    ctaHref: '/dashboard',
    highlighted: false,
    features: {
      affiliates: 'Up to 10 affiliates',
      conversions: '100 conversions/mo',
      portal: 'Standard portal',
      support: 'Community support',
      stripe: true,
      customDomain: false,
    },
  },
  {
    name: 'Indie',
    price: '$19',
    period: 'per month',
    desc: 'For growing products with an active affiliate community.',
    cta: 'Start Indie',
    ctaHref: '/dashboard',
    highlighted: true,
    features: {
      affiliates: 'Up to 100 affiliates',
      conversions: '1,000 conversions/mo',
      portal: 'Custom branded portal',
      support: 'Email support',
      stripe: true,
      customDomain: true,
    },
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per month',
    desc: 'Unlimited scale for serious affiliate programs.',
    cta: 'Start Pro',
    ctaHref: '/dashboard',
    highlighted: false,
    features: {
      affiliates: 'Unlimited affiliates',
      conversions: 'Unlimited conversions',
      portal: 'Custom branded portal',
      support: 'Priority support + Slack',
      stripe: true,
      customDomain: true,
    },
  },
]

const featureRows = [
  { key: 'affiliates', label: 'Affiliates' },
  { key: 'conversions', label: 'Conversions / month' },
  { key: 'portal', label: 'Affiliate portal' },
  { key: 'support', label: 'Support' },
  { key: 'stripe', label: 'Stripe integration' },
  { key: 'customDomain', label: 'Custom portal domain' },
]

const faqs = [
  {
    q: 'How are commissions calculated?',
    a: 'Commissions are calculated automatically from Stripe events. When a referred customer makes a payment, AffiliateKit detects the conversion via your tracking snippet and calculates the commission based on your program settings (percentage or flat rate).',
  },
  {
    q: 'When do affiliates get paid?',
    a: 'You control the payout schedule. Affiliates accumulate earnings until they hit your minimum payout threshold. You can then initiate payouts manually or set up automatic monthly payouts via bank transfer or PayPal.',
  },
  {
    q: 'Does this work with Stripe?',
    a: 'Yes — AffiliateKit is built Stripe-native. We listen to Stripe webhooks to track payments and calculate commissions in real time. Just connect your Stripe account and add our tracking snippet to your site.',
  },
  {
    q: 'Can I use my own domain for the portal?',
    a: 'Yes, on Indie and Pro plans you can set a custom domain for your affiliate portal (e.g. affiliates.yourapp.com). Just add a CNAME record and we handle the rest, including SSL.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <span className="font-bold text-lg">AffiliateKit</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link href="/dashboard" className="bg-green-500 hover:bg-green-600 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-4">Simple, honest pricing</h1>
        <p className="text-xl text-slate-400 max-w-xl mx-auto">
          Start free. Scale when you need to. We never take a cut of your revenue.
        </p>
      </section>

      {/* Tier cards */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map(tier => (
            <div key={tier.name} className={`rounded-2xl p-8 border flex flex-col relative ${tier.highlighted ? 'bg-green-500/10 border-green-500/40' : 'bg-white/5 border-white/10'}`}>
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-black">{tier.price}</span>
                  <span className="text-slate-400 text-sm pb-1">/{tier.period}</span>
                </div>
                <p className="text-sm text-slate-400">{tier.desc}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {featureRows.map(({ key, label }) => {
                  const val = tier.features[key as keyof typeof tier.features]
                  return (
                    <li key={key} className="flex items-start gap-3 text-sm">
                      <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">
                        {typeof val === 'boolean' ? label : val}
                        {typeof val === 'boolean' && !val && <span className="text-slate-500"> (not included)</span>}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <Link href={tier.ctaHref}
                className={`block text-center font-bold py-3 rounded-xl transition-colors ${tier.highlighted ? 'bg-green-500 hover:bg-green-600 text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Feature table */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Compare all features</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-slate-400 font-medium">Feature</th>
                {tiers.map(t => (
                  <th key={t.name} className={`px-6 py-4 text-center font-bold ${t.highlighted ? 'text-green-400' : ''}`}>{t.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureRows.map(({ key, label }) => (
                <tr key={key} className="border-b border-white/5 last:border-0">
                  <td className="px-6 py-4 text-slate-300">{label}</td>
                  {tiers.map(t => {
                    const val = t.features[key as keyof typeof t.features]
                    return (
                      <td key={t.name} className="px-6 py-4 text-center">
                        {typeof val === 'boolean' ? (
                          val
                            ? <Check className="h-4 w-4 text-green-400 mx-auto" />
                            : <span className="text-slate-600 text-lg">—</span>
                        ) : (
                          <span className="text-slate-300">{val}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map(({ q, a }) => (
            <div key={q} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-2">{q}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <Link href="/" className="font-semibold text-white">AffiliateKit</Link>
            <span>by ThreeStack</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <a href="mailto:hello@threestack.io" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div>© {new Date().getFullYear()} ThreeStack. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
