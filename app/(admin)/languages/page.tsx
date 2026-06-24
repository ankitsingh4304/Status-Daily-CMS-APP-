'use client'

import { useState } from 'react'
import { useApi, apiSend } from '@/hooks/use-api'
import { Badge, Button, Card, Field, Modal, Spinner, inputClass } from '@/components/ui'

type Language = {
  id: string
  code: string
  name: string
  nativeName: string
  isActive: boolean
  sortOrder: number
  _count: { content: number; users: number; categories: number }
}

export default function LanguagesPage() {
  const { data, loading, refetch } = useApi<Language[]>('/api/admin/languages')
  const [creating, setCreating] = useState(false)

  async function toggleActive(l: Language) {
    await apiSend(`/api/admin/languages/${l.id}`, 'PATCH', { isActive: !l.isActive })
    refetch()
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Languages</h1>
          <p className="text-sm text-gray-500">Languages can be added dynamically (§3)</p>
        </div>
        <Button onClick={() => setCreating(true)}>+ Add Language</Button>
      </header>

      {loading ? (
        <Spinner />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3">Content</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((l) => (
                <tr key={l.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">{l.nativeName}</p>
                    <p className="text-[11px] text-gray-400">{l.name}</p>
                  </td>
                  <td className="px-4 py-3"><Badge tone="blue">{l.code}</Badge></td>
                  <td className="px-4 py-3">{l._count.categories}</td>
                  <td className="px-4 py-3">{l._count.content}</td>
                  <td className="px-4 py-3">{l._count.users}</td>
                  <td className="px-4 py-3">
                    <Badge tone={l.isActive ? 'green' : 'gray'}>{l.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(l)}>
                      {l.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {creating && <LanguageModal onClose={() => setCreating(false)} onSaved={() => { setCreating(false); refetch() }} />}
    </div>
  )
}

function LanguageModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [nativeName, setNativeName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setError('')
    setSaving(true)
    const res = await apiSend('/api/admin/languages', 'POST', { code, name, nativeName })
    setSaving(false)
    if (!res.ok) { setError((res.data as { error?: string }).error ?? 'Save failed'); return }
    onSaved()
  }

  return (
    <Modal open onClose={onClose} title="Add Language">
      <div className="space-y-4">
        <Field label="Code (e.g. bn, gu)">
          <input value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} className={inputClass} placeholder="bn" />
        </Field>
        <Field label="Name (English)">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Bengali" />
        </Field>
        <Field label="Native name">
          <input value={nativeName} onChange={(e) => setNativeName(e.target.value)} className={inputClass} placeholder="বাংলা" />
        </Field>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !code || !name || !nativeName}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
