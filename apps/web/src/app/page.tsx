import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950">
      <div className="text-center space-y-6 px-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white">AffiliateKit</h1>
        </div>
        <p className="text-xl text-gray-400 max-w-md">
          Affiliate marketing for indie SaaS. Create programs, track conversions, manage payouts.
        </p>
        <p className="text-emerald-400 font-medium">Like PartnerStack, but at $29/mo.</p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/login">
            <Button variant="primary">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
