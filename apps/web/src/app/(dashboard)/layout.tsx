export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-white">AffiliateKit</span>
        </div>
        <nav className="space-y-1 flex-1">
          {[
            { label: 'Dashboard', href: '/dashboard', icon: '📊' },
            { label: 'Programs', href: '/dashboard/programs', icon: '🎯' },
            { label: 'Affiliates', href: '/dashboard/affiliates', icon: '👥' },
            { label: 'Conversions', href: '/dashboard/conversions', icon: '💰' },
            { label: 'Payouts', href: '/dashboard/payouts', icon: '💳' },
            { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="pt-4 border-t border-gray-800">
          <a
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
