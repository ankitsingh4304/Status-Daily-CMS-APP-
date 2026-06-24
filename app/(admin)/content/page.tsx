'use client'

import { useState } from 'react'
import { useApi, apiSend } from '@/hooks/use-api'
import { Badge, Button, Card, EmptyState, Field, Modal, Spinner, inputClass } from '@/components/ui'
import { compactNumber, formatDate } from '@/lib/format'

type Ref = { id: string; name: string; code?: string }
type Content = {
  id: string
  type: string
  title: string | null
  mediaUrl: string
  thumbnailUrl: string | null
  status: string
  isTrending: boolean
  isBlocked: boolean
  shareCount: number
  likeCount: number
  reportCount: number
  uploadDate: string
  category: Ref
  language: Ref
}
type ContentList = { items: Content[]; total: number; page: number; pages: number }

export default function ContentPage() {
  const [filters, setFilters] = useState({ categoryId: '', languageId: '', type: '', status: '', search: '', year: '' })
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showUpload, setShowUpload] = useState(false)

  const query = new URLSearchParams({ page: String(page), pageSize: '24' })
  Object.entries(filters).forEach(([k, v]) => v && query.set(k, v))

  const { data, loading, refetch } = useApi<ContentList>(`/api/admin/content?${query.toString()}`)
  const { data: categories } = useApi<Ref[]>('/api/admin/categories')
  const { data: languages } = useApi<Ref[]>('/api/admin/languages')

  function setFilter(k: string, v: string) {
    setFilters((f) => ({ ...f, [k]: v }))
    setPage(1)
    setSelected(new Set())
  }
  function toggleSel(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function bulk(action: 'publish' | 'unpublish' | 'delete' | 'reuse') {
    if (!selected.size) return
    if (action === 'delete' && !confirm(`Delete ${selected.size} items?`)) return
    await apiSend('/api/admin/content/bulk', 'POST', { action, ids: [...selected] })
    setSelected(new Set())
    refetch()
  }
  async function single(id: string, body: object) {
    await apiSend(`/api/admin/content/${id}`, 'PATCH', body)
    refetch()
  }
  async function clone(id: string) {
    await apiSend(`/api/admin/content/${id}/clone`, 'POST')
    refetch()
  }
  async function remove(id: string) {
    if (!confirm('Delete this content?')) return
    await apiSend(`/api/admin/content/${id}`, 'DELETE')
    refetch()
  }

  const years = ['2026', '2025', '2024']

  return (
    <div className="p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Content</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} templates · upload, publish & reuse</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>+ Upload Content</Button>
      </header>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          placeholder="Search title…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className={`${inputClass} w-44`}
        />
        <Select value={filters.categoryId} onChange={(v) => setFilter('categoryId', v)} placeholder="All categories"
          options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))} />
        <Select value={filters.languageId} onChange={(v) => setFilter('languageId', v)} placeholder="All languages"
          options={(languages ?? []).map((l) => ({ value: l.id, label: l.name }))} />
        <Select value={filters.type} onChange={(v) => setFilter('type', v)} placeholder="All types"
          options={[{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }]} />
        <Select value={filters.status} onChange={(v) => setFilter('status', v)} placeholder="All status"
          options={[{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }]} />
        <Select value={filters.year} onChange={(v) => setFilter('year', v)} placeholder="All years"
          options={years.map((y) => ({ value: y, label: y }))} />
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-2 text-sm">
          <span className="font-medium text-brand">{selected.size} selected</span>
          <Button size="sm" variant="secondary" onClick={() => bulk('publish')}>Publish</Button>
          <Button size="sm" variant="secondary" onClick={() => bulk('unpublish')}>Unpublish</Button>
          <Button size="sm" variant="secondary" onClick={() => bulk('reuse')}>Reuse (clone)</Button>
          <Button size="sm" variant="danger" onClick={() => bulk('delete')}>Delete</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : !data?.items.length ? (
        <EmptyState title="No content found" hint="Adjust filters or upload new content" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.items.map((c) => (
            <Card key={c.id} className={`overflow-hidden ${selected.has(c.id) ? 'ring-2 ring-brand' : ''}`}>
              <div className="relative aspect-[3/4] bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.thumbnailUrl ?? c.mediaUrl}
                  alt={c.title ?? ''}
                  className="h-full w-full object-cover"
                />
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleSel(c.id)}
                  className="absolute left-2 top-2 h-4 w-4"
                />
                <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                  <Badge tone={c.type === 'video' ? 'purple' : 'blue'}>{c.type}</Badge>
                  {c.isTrending && <Badge tone="orange">🔥 trending</Badge>}
                  {c.isBlocked && <Badge tone="red">blocked</Badge>}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <Badge tone={c.status === 'published' ? 'green' : 'gray'}>{c.status}</Badge>
                </div>
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-semibold">{c.title ?? 'Untitled'}</p>
                <p className="text-[11px] text-gray-400">{c.category.name} · {c.language.name}</p>
                <div className="mt-1 flex gap-2 text-[11px] text-gray-500">
                  <span>↗ {compactNumber(c.shareCount)}</span>
                  <span>♥ {compactNumber(c.likeCount)}</span>
                  {c.reportCount > 0 && <span className="text-red-500">⚑ {c.reportCount}</span>}
                </div>
                <p className="mt-0.5 text-[10px] text-gray-300">{formatDate(c.uploadDate)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button size="sm" variant="secondary"
                    onClick={() => single(c.id, { status: c.status === 'published' ? 'draft' : 'published' })}>
                    {c.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => clone(c.id)}>Clone</Button>
                  <Button size="sm" variant="ghost" onClick={() => single(c.id, { isTrending: !c.isTrending })}>
                    {c.isTrending ? 'Untrend' : 'Trend'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>✕</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-sm text-gray-500">Page {page} / {data.pages}</span>
          <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {showUpload && (
        <UploadModal
          categories={categories ?? []}
          languages={languages ?? []}
          onClose={() => setShowUpload(false)}
          onSaved={() => { setShowUpload(false); refetch() }}
        />
      )}
    </div>
  )
}

function Select({
  value, onChange, placeholder, options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-brand">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function UploadModal({
  categories, languages, onClose, onSaved,
}: {
  categories: Ref[]
  languages: Ref[]
  onClose: () => void
  onSaved: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [languageId, setLanguageId] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!file || !categoryId || !languageId) {
      setError('File, category and language are required')
      return
    }
    setError('')
    setSaving(true)
    try {
      // 1) upload media
      const fd = new FormData()
      fd.append('file', file)
      const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const upData = await up.json()
      if (!up.ok) { setError(upData.error ?? 'Upload failed'); return }

      // 2) create content record
      const res = await apiSend('/api/admin/content', 'POST', {
        type: upData.kind,
        title: title || null,
        mediaUrl: upData.url,
        thumbnailUrl: upData.kind === 'image' ? upData.url : null,
        categoryId,
        languageId,
        status,
      })
      if (!res.ok) { setError((res.data as { error?: string }).error ?? 'Save failed'); return }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Upload Content">
      <div className="space-y-4">
        <Field label="Media file (image or video)">
          <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm" />
        </Field>
        <Field label="Title (optional)">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Language">
            <select value={languageId} onChange={(e) => setLanguageId(e.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className={inputClass}>
            <option value="draft">Draft (preview before publish)</option>
            <option value="published">Publish immediately</option>
          </select>
        </Field>

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Uploading…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
