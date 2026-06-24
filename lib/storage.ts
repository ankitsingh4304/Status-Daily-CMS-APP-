import 'server-only'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

// Local-disk media storage. Files land in /public/uploads and are served by
// Next.js as static assets at /uploads/<file>. To move to S3/R2 later, replace
// saveMediaFile's body with an SDK putObject and return the CDN URL — callers
// only depend on the returned public path.

const UPLOAD_SUBDIR = 'uploads'

function publicDir() {
  return path.join(process.cwd(), 'public', UPLOAD_SUBDIR)
}

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
}

export type SavedMedia = {
  /** Public URL path, e.g. /uploads/ab12.mp4 */
  url: string
  /** image | video, inferred from MIME */
  kind: 'image' | 'video'
}

export async function saveMediaFile(file: File): Promise<SavedMedia> {
  const mime = file.type || 'application/octet-stream'
  const ext = EXT_BY_TYPE[mime] ?? path.extname(file.name) ?? ''
  const kind: 'image' | 'video' = mime.startsWith('video') ? 'video' : 'image'

  const filename = `${randomUUID()}${ext}`
  const dir = publicDir()
  await mkdir(dir, { recursive: true })

  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, filename), bytes)

  return { url: `/${UPLOAD_SUBDIR}/${filename}`, kind }
}
