'use client'

import { useState } from 'react'
import { useApi, apiSend } from '@/hooks/use-api'
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from '@/components/ui'
import { timeAgo } from '@/lib/format'

type Report = {
  id: string
  reason: string
  status: string
  createdAt: string
  user: { name: string | null; mobile: string } | null
  content: {
    id: string
    title: string | null
    type: string
    thumbnailUrl: string | null
    mediaUrl: string
    isBlocked: boolean
    reportCount: number
    category: { name: string }
  } | null
}

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'ignored', label: 'Ignored' },
  { key: '', label: 'All' },
]

export default function ReportsPage() {
  const [tab, setTab] = useState('pending')
  const { data, loading, refetch } = useApi<Report[]>(`/api/admin/reports${tab ? `?status=${tab}` : ''}`)

  async function act(id: string, action: 'remove' | 'block' | 'ignore' | 'resolve') {
    if (action === 'remove' && !confirm('Permanently delete this content?')) return
    await apiSend(`/api/admin/reports/${id}`, 'PATCH', { action })
    refetch()
  }

  return (
    <div className="p-6">
      <PageHeader title="Moderation" subtitle="Review reported content (§28)" />

      <div className="mb-4 flex gap-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t.key ? 'bg-brand text-white' : 'bg-surface text-muted border border-border'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState title="Nothing here" hint="No reports in this state" />
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <Card key={r.id} className="flex items-center gap-4 p-4">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-track">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.content?.thumbnailUrl ?? r.content?.mediaUrl ?? ''} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{r.content?.title ?? 'Untitled'}</p>
                  {r.content?.isBlocked && <Badge tone="red">blocked</Badge>}
                  <Badge tone={r.status === 'pending' ? 'orange' : r.status === 'resolved' ? 'green' : 'gray'}>{r.status}</Badge>
                </div>
                <p className="text-xs text-muted">{r.content?.category.name} · {r.content?.type}</p>
                <p className="mt-1 text-sm text-red-600">⚑ {r.reason}</p>
                <p className="text-[11px] text-faint">
                  by {r.user?.name ?? 'Anonymous'} · {timeAgo(r.createdAt)} · {r.content?.reportCount} total reports
                </p>
              </div>
              {r.status === 'pending' && (
                <div className="flex shrink-0 flex-col gap-1.5">
                  <Button size="sm" variant="danger" onClick={() => act(r.id, 'remove')}>Remove</Button>
                  <Button size="sm" variant="secondary" onClick={() => act(r.id, 'block')}>Block</Button>
                  <Button size="sm" variant="ghost" onClick={() => act(r.id, 'ignore')}>Ignore</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
