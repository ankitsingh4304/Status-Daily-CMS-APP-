'use client'

import { useApi } from '@/hooks/use-api'
import { Card, PageHeader, Spinner } from '@/components/ui'
import { compactNumber } from '@/lib/format'

type Analytics = {
  dau: number
  mau: number
  retention: number
  shareTrend: { date: string; count: number }[]
  mostActiveUsers: { name: string; mobile: string; events: number; isPremium: boolean }[]
  mostShared: { id: string; title: string | null; type: string; shareCount: number; likeCount: number; thumbnailUrl: string | null; category: { name: string }; language: { name: string } }[]
  topCategories: { name: string; shares: number }[]
  topLanguages: { name: string; shares: number }[]
  platforms: { platform: string; count: number }[]
}

export default function AnalyticsPage() {
  const { data, loading } = useApi<Analytics>('/api/admin/analytics')

  if (loading || !data) {
    return <div className="p-6"><Spinner /></div>
  }

  const maxTrend = Math.max(1, ...data.shareTrend.map((t) => t.count))
  const maxPlatform = Math.max(1, ...data.platforms.map((p) => p.count))
  const maxCat = Math.max(1, ...data.topCategories.map((c) => c.shares))

  return (
    <div className="p-6">
      <PageHeader title="Analytics" subtitle="User, content & platform insights (§27)" />

      {/* Top metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric label="DAU" value={compactNumber(data.dau)} />
        <Metric label="MAU" value={compactNumber(data.mau)} />
        <Metric label="DAU/MAU" value={`${data.retention}%`} />
        <Metric label="Platforms" value={String(data.platforms.length)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Share trend */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Shares — last 7 days</h2>
          <div className="flex h-40 items-end gap-2">
            {data.shareTrend.map((t) => (
              <div key={t.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t bg-brand/80" style={{ height: `${(t.count / maxTrend) * 100}%` }} />
                </div>
                <span className="text-[10px] text-faint">{t.date}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Platform analytics */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Shares by platform</h2>
          <div className="space-y-2">
            {data.platforms.map((p) => (
              <div key={p.platform} className="flex items-center gap-3">
                <span className="w-20 text-xs capitalize text-muted">{p.platform}</span>
                <div className="h-4 flex-1 rounded bg-track">
                  <div className="h-4 rounded bg-blue-500" style={{ width: `${(p.count / maxPlatform) * 100}%` }} />
                </div>
                <span className="w-10 text-right text-xs text-muted">{compactNumber(p.count)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top categories */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Top categories by shares</h2>
          <div className="space-y-2">
            {data.topCategories.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-24 truncate text-xs text-muted">{c.name}</span>
                <div className="h-4 flex-1 rounded bg-track">
                  <div className="h-4 rounded bg-brand" style={{ width: `${(c.shares / maxCat) * 100}%` }} />
                </div>
                <span className="w-12 text-right text-xs text-muted">{compactNumber(c.shares)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Most active users */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Most active users</h2>
          <div className="space-y-1.5">
            {data.mostActiveUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{u.name} {u.isPremium && <span className="text-purple-500">★</span>}</span>
                <span className="text-xs text-faint">{u.events} events</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Most shared content */}
      <Card className="mt-4 p-5">
        <h2 className="mb-4 text-sm font-semibold">Most shared content</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {data.mostShared.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-lg border border-border">
              <div className="aspect-[3/4] bg-track">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.thumbnailUrl ?? ''} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-1.5">
                <p className="truncate text-[11px] font-medium">{c.title ?? 'Untitled'}</p>
                <p className="text-[10px] text-faint">↗ {compactNumber(c.shareCount)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  )
}
