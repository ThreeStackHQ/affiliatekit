import { Card } from '@/components/ui/card'

export default function DashboardPage() {
  const stats = [
    { label: 'Total Clicks', value: '0', change: '+0%', icon: '👆' },
    { label: 'Conversions', value: '0', change: '+0%', icon: '✅' },
    { label: 'Revenue', value: '$0.00', change: '+0%', icon: '💰' },
    { label: 'Active Affiliates', value: '0', change: '+0', icon: '👥' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Welcome to AffiliateKit. Track your affiliate program performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <p className="text-xs text-emerald-400 mt-1">{stat.change} this month</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Getting Started</h2>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Create your first affiliate program', done: false },
            { step: '2', title: 'Share your affiliate link with partners', done: false },
            { step: '3', title: 'Track clicks and conversions', done: false },
            { step: '4', title: 'Process your first payout', done: false },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold ${item.done ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {item.done ? '✓' : item.step}
              </div>
              <span className={item.done ? 'text-gray-500 line-through' : 'text-gray-300'}>
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
