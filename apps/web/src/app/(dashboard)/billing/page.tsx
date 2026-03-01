'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CreditCard,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Users,
  ArrowRightLeft,
} from 'lucide-react'

// ─── Mock data (MVP — wire to real DB later) ─────────────────────────────────
const MOCK_PLAN = 'indie' as 'free' | 'indie' | 'pro'
const MOCK_RENEWAL = 'April 1, 2026'
const MOCK_USAGE = {
  programs: { used: 2, limit: 3 },
  affiliates: { used: 47, limit: 100 },
  conversions: { used: 312, limit: Infinity },
}

// ─── Types ────────────────────────────────────────────────────────────────────
type PlanName = 'free' | 'indie' | 'pro'

interface PlanConfig {
  label: string
  price: number
  color: string
  features: string[]
}

const PLAN_CONFIG: Record<PlanName, PlanConfig> = {
  free: {
    label: 'Free',
    price: 0,
    color: 'text-slate-400',
    features: ['1 affiliate program', '10 affiliates', '100 conversions / mo', 'Basic analytics'],
  },
  indie: {
    label: 'Indie',
    price: 9,
    color: 'text-green-400',
    features: [
      '3 affiliate programs',
      '100 affiliates',
      'Unlimited conversions',
      'Advanced analytics',
      'CSV exports',
      'Email support',
    ],
  },
  pro: {
    label: 'Pro',
    price: 29,
    color: 'text-emerald-300',
    features: [
      'Unlimited programs',
      'Unlimited affiliates',
      'Unlimited conversions',
      'Priority analytics',
      'CSV & API exports',
      'Priority support',
      'Custom domain tracking',
    ],
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pct(used: number, limit: number): number {
  if (limit === Infinity || limit === 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

function limitLabel(limit: number): string {
  return limit === Infinity ? '∞' : String(limit)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function UsageBar({ value, max }: { value: number; max: number }) {
  const percent = pct(value, max)
  const isUnlimited = max === Infinity
  const danger = percent >= 90

  return (
    <div className="mt-2">
      {isUnlimited ? (
        <div className="text-xs text-slate-500">Unlimited</div>
      ) : (
        <>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{value.toLocaleString()} used</span>
            <span>{percent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${danger ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </>
      )}
    </div>
  )
}

async function callPortal() {
  const res = await fetch('/api/stripe/portal', { method: 'POST' })
  if (res.redirected) {
    window.location.href = res.url
  }
}

async function callCheckout(plan: 'indie' | 'pro') {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  })
  if (res.ok) {
    const data = (await res.json()) as { url?: string }
    if (data.url) window.location.href = data.url
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function BillingPageInner() {
  const searchParams = useSearchParams()
  const [showBanner, setShowBanner] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  const currentPlan = MOCK_PLAN
  const planCfg = PLAN_CONFIG[currentPlan]
  const upgradePlan: 'indie' | 'pro' | null =
    currentPlan === 'free' ? 'indie' : currentPlan === 'indie' ? 'pro' : null
  const upgradeCfg = upgradePlan ? PLAN_CONFIG[upgradePlan] : null

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowBanner(true)
      const t = setTimeout(() => setShowBanner(false), 6000)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      await callPortal()
    } finally {
      setPortalLoading(false)
    }
  }

  const handleUpgrade = async () => {
    if (!upgradePlan) return
    setUpgradeLoading(true)
    try {
      await callCheckout(upgradePlan)
    } finally {
      setUpgradeLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success banner */}
      {showBanner && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-500/15 border border-green-500/40 rounded-xl text-green-400 text-sm font-medium">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Subscription activated! Welcome to {planCfg.label} 🎉
          <button
            onClick={() => setShowBanner(false)}
            className="ml-auto text-green-600 hover:text-green-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Billing &amp; Subscription</h1>
        <p className="text-slate-400 mt-1">Manage your plan and payment details.</p>
      </div>

      {/* Current plan card */}
      <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Zap className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Current plan</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${planCfg.color}`}>{planCfg.label}</span>
              {planCfg.price > 0 && (
                <span className="text-slate-400 text-sm">
                  ${planCfg.price}
                  <span className="text-slate-600">/mo</span>
                </span>
              )}
            </div>
            {currentPlan !== 'free' && (
              <p className="text-xs text-slate-500 mt-0.5">
                Renews {MOCK_RENEWAL}
              </p>
            )}
          </div>
        </div>

        {currentPlan !== 'free' && (
          <div className="flex flex-col gap-2 md:items-end">
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              {portalLoading ? 'Opening…' : 'Manage Billing'}
            </button>
            <button
              onClick={handlePortal}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Cancel plan
            </button>
          </div>
        )}
      </div>

      {/* Usage */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Usage this month</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Programs */}
          <div className="bg-[#0a1628] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">Programs</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {MOCK_USAGE.programs.used}
              <span className="text-base text-slate-500 ml-1">
                / {limitLabel(MOCK_USAGE.programs.limit)}
              </span>
            </div>
            <UsageBar value={MOCK_USAGE.programs.used} max={MOCK_USAGE.programs.limit} />
          </div>

          {/* Affiliates */}
          <div className="bg-[#0a1628] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">Affiliates</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {MOCK_USAGE.affiliates.used}
              <span className="text-base text-slate-500 ml-1">
                / {limitLabel(MOCK_USAGE.affiliates.limit)}
              </span>
            </div>
            <UsageBar value={MOCK_USAGE.affiliates.used} max={MOCK_USAGE.affiliates.limit} />
          </div>

          {/* Conversions */}
          <div className="bg-[#0a1628] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">Conversions</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {MOCK_USAGE.conversions.used.toLocaleString()}
              <span className="text-base text-slate-500 ml-1">
                / {limitLabel(MOCK_USAGE.conversions.limit)}
              </span>
            </div>
            <UsageBar value={MOCK_USAGE.conversions.used} max={MOCK_USAGE.conversions.limit} />
          </div>
        </div>
      </div>

      {/* Plan comparison / upgrade */}
      {upgradePlan && upgradeCfg && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Upgrade your plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current */}
            <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Current — {planCfg.label}
              </div>
              <div className="text-xl font-bold text-white mb-4">
                {planCfg.price === 0 ? 'Free' : `$${planCfg.price}/mo`}
              </div>
              <ul className="space-y-2">
                {planCfg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-slate-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Upgrade target */}
            <div className="bg-green-500/5 border border-green-500/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                RECOMMENDED
              </div>
              <div className="text-xs text-green-500 uppercase tracking-wider mb-1">
                Upgrade — {upgradeCfg.label}
              </div>
              <div className="text-xl font-bold text-white mb-4">${upgradeCfg.price}/mo</div>
              <ul className="space-y-2 mb-6">
                {upgradeCfg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleUpgrade}
                disabled={upgradeLoading}
                className="w-full py-2.5 px-4 bg-[#16a34a] hover:bg-green-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {upgradeLoading ? 'Redirecting…' : `Upgrade to ${upgradeCfg.label} →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro already — just show feature list */}
      {currentPlan === 'pro' && (
        <div className="bg-green-500/5 border border-green-500/30 rounded-2xl p-6 flex items-center gap-4">
          <CheckCircle2 className="h-8 w-8 text-green-400 shrink-0" />
          <div>
            <p className="font-semibold text-white">You&apos;re on the Pro plan</p>
            <p className="text-sm text-slate-400 mt-0.5">
              You have unlimited access to all AffiliateKit features.
            </p>
          </div>
        </div>
      )}

      {/* Payment method */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Payment method</h2>
        <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          {currentPlan === 'free' ? (
            <div className="flex items-center gap-3 text-slate-500">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">No payment method on file.</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="h-10 w-16 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Visa •••• 4242</p>
                  <p className="text-xs text-slate-500">Expires 12/2027</p>
                </div>
              </div>
              <button
                onClick={handlePortal}
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                Update
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading…</div>}>
      <BillingPageInner />
    </Suspense>
  )
}
