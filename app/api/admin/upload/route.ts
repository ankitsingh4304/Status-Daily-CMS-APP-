import { saveMediaFile } from '@/lib/storage'
import { badRequest, created, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

// Media upload — saves to local disk now, returns a public URL.
export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return badRequest('No file provided (field "file")')

  const saved = await saveMediaFile(file)
  return created(saved)
}
