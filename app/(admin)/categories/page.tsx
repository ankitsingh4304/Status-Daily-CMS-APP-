'use client'

import { useState } from 'react'
import { useApi, apiSend } from '@/hooks/use-api'
import { Badge, Button, Card, EmptyState, Field, Modal, PageHeader, Spinner, inputClass } from '@/components/ui'

type Lang = { id: string; code: string; name: string }
type Category = {
  id: string
  key: string
  name: string
  isPublished: boolean
  sortOrder: number
  languages: Lang[]
  _count: { content: number }
}

export default function CategoriesPage() {
  const { data: categories, loading, refetch } = useApi<Category[]>('/api/admin/categories')
  const { data: languages } = useApi<Lang[]>('/api/admin/languages')
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)

  async function togglePublish(c: Category) {
    await apiSend(`/api/admin/categories/${c.id}`, 'PATCH', { isPublished: !c.isPublished })
    refetch()
  }
  async function remove(c: Category) {
    if (!confirm(`Delete "${c.name}" and its ${c._count.content} content items?`)) return
    await apiSend(`/api/admin/categories/${c.id}`, 'DELETE')
    refetch()
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Categories"
        subtitle="Create categories and map them to languages"
        actions={<Button onClick={() => setCreating(true)}>+ New Category</Button>}
      />

      {loading ? (
        <Spinner />
      ) : !categories?.length ? (
        <EmptyState title="No categories yet" hint="Create your first category" />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-[11px] text-faint">{c.key}</p>
                </div>
                <Badge tone={c.isPublished ? 'green' : 'gray'}>
                  {c.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {c.languages.map((l) => (
                  <Badge key={l.id} tone="blue">{l.code}</Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">{c._count.content} content items</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(c)}>Edit</Button>
                <Button size="sm" variant="secondary" onClick={() => togglePublish(c)}>
                  {c.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(c)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CategoryModal
          category={editing}
          languages={languages ?? []}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={() => {
            setCreating(false)
            setEditing(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}

function CategoryModal({
  category,
  languages,
  onClose,
  onSaved,
}: {
  category: Category | null
  languages: Lang[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(category?.name ?? '')
  const [key, setKey] = useState(category?.key ?? '')
  const [isPublished, setIsPublished] = useState(category?.isPublished ?? false)
  const [langIds, setLangIds] = useState<string[]>(category?.languages.map((l) => l.id) ?? [])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleLang(id: string) {
    setLangIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function save() {
    setError('')
    setSaving(true)
    const payload = { name, isPublished, languageIds: langIds, ...(category ? {} : { key }) }
    const res = category
      ? await apiSend(`/api/admin/categories/${category.id}`, 'PATCH', payload)
      : await apiSend('/api/admin/categories', 'POST', payload)
    setSaving(false)
    if (!res.ok) {
      setError((res.data as { error?: string }).error ?? 'Save failed')
      return
    }
    onSaved()
  }

  return (
    <Modal open onClose={onClose} title={category ? 'Edit Category' : 'New Category'}>
      <div className="space-y-4">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        {!category && (
          <Field label="Key (slug, lowercase_underscore)">
            <input
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
              className={inputClass}
              placeholder="good_morning"
            />
          </Field>
        )}
        <Field label="Languages">
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => toggleLang(l.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  langIds.includes(l.id) ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
          Published (visible in app)
        </label>

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
