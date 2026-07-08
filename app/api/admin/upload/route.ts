import { saveMediaFile } from '@/lib/storage'
import { badRequest, created, requireAdmin, serverError } from '@/lib/api'
import { NextResponse } from 'next/server'

// Media upload — stores to R2 in production (local disk in dev), returns a public URL.
export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return badRequest('No file provided (field "file")')

  try {
    const saved = await saveMediaFile(file)
    return created(saved)
  } catch (err) {
    const e = err as Error
    console.error('[upload] failed:', e?.stack)
    // TEMP DIAGNOSTIC: return the stack so we can see exactly which line throws.
    return serverError(`Upload failed: ${e?.name}: ${e?.message}\n---STACK---\n${e?.stack}`)
  }
}
