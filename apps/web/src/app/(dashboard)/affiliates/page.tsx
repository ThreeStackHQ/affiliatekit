'use client'
import { useState } from 'react'
import { UserPlus, Search } from 'lucide-react'

const mockAffiliates = [
  { id: '1', name: 'Sarah Chen', email: 's***@example.com', joined: '2026-01-15', clicks: 847, conversions: 23, earned: '$1,242', status: 'active' },
  { id: '2', name: 'Mike Rodriguez', email: 'm***@gmail.com', joined: '2026-01-28', clicks: 623, conversions: 18, earned: '$972', status: 'active' },
  { id: '3', name: 'Emma Wilson', email: 'e***@outlook.com', joined: '2026-02-03', clicks: 412, conversions: 11, earned: '$594', status: 'active' },
  { id: '4', name: 'James Lee', email: 'j***@yahoo.com', joined: '2026-02-14', clicks: 89, conversions: 2, earned: '$108', status: 'pending' },
  { id: '5', name: 'Alex Kim', email: 'a***@proton.me', joined: '2026-02-20', clicks: 34, conversions: 0, earned: '$0', status: 'pending' },
]

export default function AffiliatesPage() {
  const [search, setSearch] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const filtered = mockAffiliates.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.includes(search))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Affiliates</h1>
          <div className="flex gap-6 text-sm text-slate-400 mt-2">
            <span>Total: <strong className="text-white">5</strong></span>
            <span>Active: <strong className="text-green-400">3</strong></span>
            <span>Pending: <strong className="text-amber-400">2</strong></span>
          </div>
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex gap-3">
        <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="affiliate@email.com"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
        <button onClick={() => setInviteEmail('')} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
          <UserPlus className="h-4 w-4" />Send Invite
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search affiliates..."
          className="w-full pl-9 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-slate-400">
            <tr>
              <th className="text-left px-4 py-3">Affiliate</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th className="text-right px-4 py-3">Clicks</th>
              <th className="text-right px-4 py-3">Conversions</th>
              <th className="text-right px-4 py-3">Earned</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-slate-500">{a.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-400">{a.joined}</td>
                <td className="px-4 py-3 text-right">{a.clicks}</td>
                <td className="px-4 py-3 text-right">{a.conversions}</td>
                <td className="px-4 py-3 text-right text-green-400">{a.earned}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{a.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {a.status === 'pending' && (
                    <div className="flex gap-1 justify-end">
                      <button className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-2 py-1 rounded">Approve</button>
                      <button className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2 py-1 rounded">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
