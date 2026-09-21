import { Link } from 'react-router'
import type { ReactNode } from 'react'
import BrandPanel from './BrandPanel'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f9fc] lg:grid lg:grid-cols-2">
      <BrandPanel />
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 block text-sm font-semibold text-violet-600">? StreakFlow ? In?cio</Link>
          {children}
        </div>
      </main>
    </div>
  )
}
