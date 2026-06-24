'use client'

import { useState } from 'react'
import { useApi } from '@/hooks/use-api'
import { Badge, Card, EmptyState, PageHeader, Spinner, inputClass } from '@/components/ui'
import { compactNumber, formatDate, timeAgo } from '@/lib/format'

type User = {
  id: string
  name: string | null
  mobile: string
  isPremium: boolean
  registeredAt: string
  lastActiveAt: string
  language: { name: string; code: string } | null
  _count: { shares: number }
}
type UserList = { items: User[]; total: number; page: number; pages: number }

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [premium, setPremium] = useState(false)
  const [page, setPage] = useState(1)

  const query = new URLSearchParams({ page: String(page), pageSize: '25' })
  if (search) query.set('search', search)
  if (premium) query.set('premium', 'true')

  const { data, loading } = useApi<UserList>(`/api/admin/users?${query.toString()}`)

  return (
    <div className="p-6">
      <PageHeader title="Users" subtitle={`${data?.total ?? 0} registered users (§26)`} />

      <div className="mb-4 flex items-center gap-2">
        <input placeholder="Search name or mobile…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} className={`${inputClass} w-56`} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={premium} onChange={(e) => { setPremium(e.target.checked); setPage(1) }} />
          Premium only
        </label>
      </div>

      {loading ? (
        <Spinner />
      ) : !data?.items.length ? (
        <EmptyState title="No users found" />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wide text-faint">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Shares</th>
                <th className="px-4 py-3">Premium</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} className="border-t border-border transition-colors hover:bg-subtle/60">
                  <td className="px-4 py-3 font-medium">{u.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{u.mobile}</td>
                  <td className="px-4 py-3">{u.language ? <Badge tone="blue">{u.language.code}</Badge> : '—'}</td>
                  <td className="px-4 py-3">{compactNumber(u._count.shares)}</td>
                  <td className="px-4 py-3">{u.isPremium ? <Badge tone="purple">Premium</Badge> : <span className="text-faint">Free</span>}</td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(u.registeredAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{timeAgo(u.lastActiveAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {data && data.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-border px-3 py-1 disabled:opacity-40">Prev</button>
          <span className="text-muted">Page {page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
