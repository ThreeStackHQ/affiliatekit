import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Zap, DollarSign, Code2, Globe, Check, X } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AffiliateKit — Add an Affiliate Program in 10 Minutes',
  description: 'No revenue cuts. No monthly fees for affiliates. Just Stripe-native commission tracking that works. Launch your affiliate program today.',
  openGraph: {
    title: 'AffiliateKit — Add an Affiliate Program in 10 Minutes',
    description: 'No revenue cuts. No monthly fees for affiliates. Stripe-native commission tracking that works.',
    url: 'https://affiliatekit.threestack.io',
    siteName: 'AffiliateKit',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AffiliateKit — Affiliate Programs Made Simple',
    description: 'No revenue cuts. No monthly fees. Just Stripe-native commission tracking.',
  },
}

const features = [
  {
    icon: Zap,
    title: 'Stripe-Native',
    desc: 'Commissions calculated directly from Stripe events. No manual reconciliation, no spreadsheets.',
  },
  {
    icon: DollarSign,
    title: 'No Revenue Cut',
    desc: 'We charge a flat monthly fee — not a percentage of your revenue. Keep what you earn.',
  },
  {
    icon: Code2,
    title: 'Embeddable Tracker',
    desc: 'One script tag. Track clicks, conversions, and commissions across any website or app.',
  },
  {
    icon: Globe,
    title: 'Affiliate Portal Included',
    desc: 'Your affiliates get a branded dashboard with their stats, referral link, and marketing assets.',
  },
]

const comparison = [
  { feature: 'Monthly cost', ak: 'Free / $19 / $49', rewardful: '$49/mo', fp: '$49/mo' },
  { feature: 'Revenue cut', ak: '0%', rewardful: '1%', fp: '0%' },
  { feature: 'Stripe native', ak: true, rewardful: true, fp: false },
  { feature: 'Affiliate portal', ak: true, rewardful: true, fp: true },
  { feature: 'Custom portal domain', ak: true, rewardful: false, fp: true },
  { feature: 'Embeddable tracker', ak: true, rewardful: false, fp: false },
  { feature: 'Free tier available', ak: true, rewardful: false, fp: false },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <span className="font-bold text-lg">AffiliateKit</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#compare" className="hover:text-white transition-colors">Compare</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">Sign in</Link>
            <Link href="/dashboard" className="bg-green-500 hover:bg-green-600 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          Now in public beta · 500+ programs launched
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
          Add an affiliate program<br />
          <span className="text-green-400">in 10 minutes.</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          No revenue cuts. No monthly fees for affiliates. Just Stripe-native commission tracking that works.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-4 rounded-xl text-lg transition-colors">
            Start for Free →
          </Link>
          <Link href="#features" className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl text-lg transition-colors">
            See how it works
          </Link>
        </div>
        {/* Social proof numbers */}
        <div className="flex flex-col sm:flex-row gap-8 justify-center mt-16 text-sm text-slate-400">
          <div className="text-center">
            <div className="text-3xl font-black text-white">500+</div>
            <div>programs launched</div>
          </div>
          <div className="hidden sm:block w-px bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-black text-green-400">$2M+</div>
            <div>commissions tracked</div>
          </div>
          <div className="hidden sm:block w-px bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-black text-white">10,000+</div>
            <div>affiliates</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to run affiliates</h2>
          <p className="text-slate-400 text-lg">Built for SaaS founders who want results, not complexity.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-green-500/30 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section id="compare" className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How we compare</h2>
          <p className="text-slate-400 text-lg">Honest comparison. No asterisks.</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-slate-400 font-medium">Feature</th>
                <th className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-bold text-green-400">AffiliateKit</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-slate-400 font-medium">Rewardful $49/mo</th>
                <th className="px-6 py-4 text-center text-slate-400 font-medium">FirstPromoter $49/mo</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(({ feature, ak, rewardful, fp }) => (
                <tr key={feature} className="border-b border-white/5 last:border-0">
                  <td className="px-6 py-4 text-slate-300">{feature}</td>
                  <td className="px-6 py-4 text-center">
                    {typeof ak === 'boolean' ? (
                      ak ? <Check className="h-5 w-5 text-green-400 mx-auto" /> : <X className="h-5 w-5 text-slate-600 mx-auto" />
                    ) : <span className="text-green-400 font-semibold">{ak}</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {typeof rewardful === 'boolean' ? (
                      rewardful ? <Check className="h-5 w-5 text-slate-400 mx-auto" /> : <X className="h-5 w-5 text-slate-600 mx-auto" />
                    ) : <span className="text-slate-400">{rewardful}</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {typeof fp === 'boolean' ? (
                      fp ? <Check className="h-5 w-5 text-slate-400 mx-auto" /> : <X className="h-5 w-5 text-slate-600 mx-auto" />
                    ) : <span className="text-slate-400">{fp}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-green-500/10 via-green-400/5 to-green-500/10 border border-green-500/20 rounded-3xl p-12">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Launch your affiliate program <span className="text-green-400">today.</span>
          </h2>
          <p className="text-slate-400 text-xl mb-8 max-w-xl mx-auto">
            Free forever on the starter plan. No credit card required. Takes 10 minutes to set up.
          </p>
          <Link href="/dashboard" className="inline-block bg-green-500 hover:bg-green-600 text-black font-bold px-10 py-4 rounded-xl text-lg transition-colors">
            Get Started Free →
          </Link>
          <p className="text-sm text-slate-500 mt-4">No credit card · Free forever plan · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="font-semibold text-white">AffiliateKit</span>
            <span>by ThreeStack</span>
          </div>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <a href="mailto:hello@threestack.io" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div>© {new Date().getFullYear()} ThreeStack. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
