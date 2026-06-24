'use client'

import Link from 'next/link'
import { useApi } from '@/hooks/use-api'
import { Card, Spinner } from '@/components/ui'
import { compactNumber } from '@/lib/format'

type Stats = {
  totalUsers: number
  premiumUsers: number
  activeUsers: number
  totalShares: number
  totalCategories: number
  totalContent: number
  topCategory: string
  topLanguage: string
}

export default function DashboardPage() {
  const { data, loading } = useApi<Stats>('/api/admin/dashboard')

  const cards = data
    ? [
        { label: 'Total Users', value: compactNumber(data.totalUsers), tone: 'text-blue-600', icon: '☺' },
        { label: 'Premium Users', value: compactNumber(data.premiumUsers), tone: 'text-purple-600', icon: '★' },
        { label: 'Active Users (30d)', value: compactNumber(data.activeUsers), tone: 'text-green-600', icon: '◉' },
        { label: 'Total Shares', value: compactNumber(data.totalShares), tone: 'text-brand', icon: '↗' },
        { label: 'Categories', value: String(data.totalCategories), tone: 'text-amber-600', icon: '◫' },
        { label: 'Uploaded Content', value: compactNumber(data.totalContent), tone: 'text-teal-600', icon: '▦' },
        { label: 'Top Category', value: data.topCategory, tone: 'text-rose-600', icon: '♛', small: true },
        { label: 'Top Language', value: data.topLanguage, tone: 'text-indigo-600', icon: '⒜', small: true },
      ]
    : []

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of Status Daily activity</p>
      </header>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {cards.map((c) => (
              <Card key={c.label} className="p-4">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-gray-500">{c.label}</p>
                  <span className={`text-lg ${c.tone}`}>{c.icon}</span>
                </div>
                <p className={`mt-2 font-bold ${c.small ? 'text-lg' : 'text-2xl'}`}>{c.value}</p>
              </Card>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <QuickLink href="/content" title="Manage Content" desc="Upload, publish & organize templates" />
            <QuickLink href="/categories" title="Manage Categories" desc="Create categories & map languages" />
            <QuickLink href="/reports" title="Moderation Queue" desc="Review reported content" />
          </div>
        </>
      )}
    </div>
  )
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 transition-shadow hover:shadow-md">
        <p className="text-sm font-semibold text-brand">{title} →</p>
        <p className="mt-1 text-xs text-gray-500">{desc}</p>
      </Card>
    </Link>
  )
}
