'use client'
import { useState } from 'react'
import { TrendingUp, Copy, Check, Link, ExternalLink } from 'lucide-react'

export default function AffiliatePortalPage() {
  const [copied, setCopied] = useState(false)
  const referralLink = 'https://app.threestack.io?ref=sarah_abc123'

  const copy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="h-8 w-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold">AffiliateKit Portal</h1>
            <p className="text-slate-400 text-sm">Your affiliate dashboard</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[['Clicks','847'],['Conversions','23'],['Earned','$1,242'],['Pending','$198']].map(([label, value]) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-slate-400 text-sm">{label}</p>
              <p className="text-3xl font-bold mt-1 text-green-400">{value}</p>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-3">Your Referral Link</h3>
          <div className="flex items-center gap-2 bg-[#0f172a] rounded-lg px-4 py-3">
            <Link className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-300 flex-1 truncate">{referralLink}</span>
            <button onClick={copy} className="text-green-400 hover:text-green-300 flex items-center gap-1 text-sm flex-shrink-0">
              {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy</>}
            </button>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Marketing Assets</h3>
          <div className="space-y-3">
            {['Banner 728x90','Banner 300x250','Social Card 1200x630'].map(asset => (
              <div key={asset} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-slate-300">{asset}</span>
                <button className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
                  <ExternalLink className="h-3 w-3" />Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
