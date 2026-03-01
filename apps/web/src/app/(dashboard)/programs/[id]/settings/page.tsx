'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function ProgramSettingsPage() {
  const [commissionType, setCommissionType] = useState('percentage')
  const [commissionAmount, setCommissionAmount] = useState('20')
  const [cookieDays, setCookieDays] = useState('30')
  const [minPayout, setMinPayout] = useState('50')
  const [terms, setTerms] = useState('Affiliates earn commission on all referred sales. Commissions are paid monthly via bank transfer or PayPal.')
  const [isActive, setIsActive] = useState(true)
  const [copied, setCopied] = useState(false)

  const snippet = `<script src="https://cdn.affiliatekit.io/tracker.js"\n  data-program="prog_abc123"\n  data-commission="${commissionAmount}${commissionType === 'percentage' ? '%' : '$'}">\n</script>`

  const copy = () => { navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Program Settings</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Status</span>
          <button onClick={() => setIsActive(!isActive)}
            className={`w-12 h-6 rounded-full transition-colors relative ${isActive ? 'bg-green-500' : 'bg-white/20'}`}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-medium ${isActive ? 'text-green-400' : 'text-slate-400'}`}>{isActive ? 'Active' : 'Paused'}</span>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">Commission</h3>
          <div className="flex gap-3">
            {['percentage','flat'].map(t => (
              <button key={t} onClick={() => setCommissionType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${commissionType === t ? 'bg-green-500 text-black' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{t === 'percentage' ? 'Percentage %' : 'Flat Rate $'}</button>
            ))}
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-slate-400 mb-1 block">Amount</label>
              <div className="flex items-center">
                <input value={commissionAmount} onChange={e => setCommissionAmount(e.target.value)} type="number"
                  className="flex-1 bg-white/5 border border-white/10 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
                <span className="px-3 py-2 bg-white/10 border border-white/10 border-l-0 rounded-r-lg text-sm text-slate-400">{commissionType === 'percentage' ? '%' : '$'}</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm text-slate-400 mb-1 block">Cookie Duration</label>
              <select value={cookieDays} onChange={e => setCookieDays(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                {['7','14','30','60','90'].map(d => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Minimum Payout ($)</label>
            <input value={minPayout} onChange={e => setMinPayout(e.target.value)} type="number"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <label className="text-sm text-slate-400 mb-2 block">Custom Terms</label>
          <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none" />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Tracking Snippet</h3>
            <button onClick={copy} className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300">
              {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy</>}
            </button>
          </div>
          <pre className="bg-[#0f172a] rounded-lg p-4 text-xs text-green-400 font-mono overflow-x-auto">{snippet}</pre>
        </div>
        <button className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 rounded-lg transition-colors">Save Settings</button>
      </div>
    </div>
  )
}
