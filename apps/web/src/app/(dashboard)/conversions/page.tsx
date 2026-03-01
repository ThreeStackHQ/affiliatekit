'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'

const convs = [
  { date: '2026-03-01', affiliate: 'Sarah Chen', customer: 'j***@acme.com', amount: '$99', commission: '$19.80', status: 'confirmed' },
  { date: '2026-03-01', affiliate: 'Mike Rodriguez', customer: 'p***@startup.io', amount: '$49', commission: '$9.80', status: 'pending' },
  { date: '2026-02-28', affiliate: 'Sarah Chen', customer: 'a***@corp.com', amount: '$199', commission: '$39.80', status: 'paid' },
  { date: '2026-02-28', affiliate: 'Emma Wilson', customer: 'n***@gmail.com', amount: '$99', commission: '$19.80', status: 'confirmed' },
  { date: '2026-02-27', affiliate: 'Mike Rodriguez', customer: 'r***@biz.com', amount: '$49', commission: '$9.80', status: 'paid' },
]

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  paid: 'bg-green-500/20 text-green-400',
}

export default function ConversionsPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? convs : convs.filter(c => c.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Conversions</h1>
          <div className="flex gap-6 mt-2 text-sm text-slate-400">
            <span>Revenue: <strong className="text-white">$4,821</strong></span>
            <span>Commissions: <strong className="text-green-400">$964</strong></span>
            <span>Pending: <strong className="text-amber-400">$29.60</strong></span>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-sm transition-colors">
          <Download className="h-4 w-4" />Export CSV
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        {['all','pending','confirmed','paid'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === s ? 'bg-green-500 text-black' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{s}</button>
        ))}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-slate-400">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Affiliate</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-right px-4 py-3">Commission</th>
              <th className="text-center px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="px-4 py-3 text-slate-400">{c.date}</td>
                <td className="px-4 py-3">{c.affiliate}</td>
                <td className="px-4 py-3 text-slate-400">{c.customer}</td>
                <td className="px-4 py-3 text-right">{c.amount}</td>
                <td className="px-4 py-3 text-right text-green-400">{c.commission}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.status]}`}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
