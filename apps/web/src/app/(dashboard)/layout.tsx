'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { Layers, Users, ArrowRightLeft, DollarSign, Settings, Menu, TrendingUp } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Programs', icon: Layers },
  { href: '/affiliates', label: 'Affiliates', icon: Users },
  { href: '/conversions', label: 'Conversions', icon: ArrowRightLeft },
  { href: '/payouts', label: 'Payouts', icon: DollarSign },
  { href: '/settings', label: 'Settings', icon: Settings },
]

type Stats = {
  totalEarned: string
  totalClicks: number
  totalConversions: number
  totalAffiliates: number
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data) })
      .catch(() => {})
  }, [])

  const userEmail = session?.user?.email ?? ''
  const userInitial = (session?.user?.name ?? session?.user?.email ?? 'U')[0]?.toUpperCase() ?? 'U'

  return (
    <div className="flex h-screen bg-[#0f172a] text-white">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1628] border-r border-white/10 transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex md:flex-col`}>
        <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <TrendingUp className="h-6 w-6 text-green-500" />
          <span className="font-bold text-lg">AffiliateKit</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold text-black">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail || 'Loading…'}</p>
            </div>
          </div>
          <button onClick={() => signOut()} className="w-full text-left text-xs text-slate-500 hover:text-white transition-colors">Sign out</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-[#0a1628]">
          <button className="md:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-6 text-sm text-slate-400">
            {stats ? (
              <>
                <span>Total Earned: <strong className="text-green-400">${stats.totalEarned}</strong></span>
                <span>Clicks: <strong className="text-white">{stats.totalClicks.toLocaleString()}</strong></span>
                <span>Conversions: <strong className="text-green-400">{stats.totalConversions.toLocaleString()}</strong></span>
              </>
            ) : (
              <span className="text-slate-600 text-xs">Loading stats…</span>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
