import 'server-only'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

/**
 * Media storage with two backends, chosen by env:
 *
 *  - Cloudflare R2 (production)  — when R2_* env vars are set. Images are
 *    converted to WebP (blueprint compression requirement); video stored as-is.
 *    Public URLs come from R2_PUBLIC_URL (the bucket's public/custom-domain URL).
 *    R2 has zero egress fees, so serving media to the app stays free.
 *
 *  - Local disk (dev fallback)   — when R2 is not configured. Files land in
 *    /public/uploads and are served by Next.js at /uploads/<file>.
 *
 * Callers only depend on the returned public URL + kind, so flipping backends is
 * just an env change — no code changes elsewhere.
 */

const UPLOAD_SUBDIR = 'uploads'

const R2 = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucket: process.env.R2_BUCKET,
  // Public base URL for the bucket (r2.dev URL or a custom domain), no trailing slash.
  publicUrl: process.env.R2_PUBLIC_URL?.replace(/\/$/, ''),
}

function r2Enabled(): boolean {
  return Boolean(R2.accountId && R2.accessKeyId && R2.secretAccessKey && R2.bucket && R2.publicUrl)
}

let _client: S3Client | null = null
function r2Client(): S3Client {
  if (_client) return _client
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2.accessKeyId!,
      secretAccessKey: R2.secretAccessKey!,
    },
  })
  return _client
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
  /** Public URL — absolute (R2) or app-relative /uploads/... (local dev). */
  url: string
  /** image | video, inferred from MIME. */
  kind: 'image' | 'video'
}

export type UploadKind = 'content' | 'profile'

/**
 * Copy bytes onto a freshly-allocated, NON-shared ArrayBuffer. `new Uint8Array(n)`
 * always allocates a normal ArrayBuffer, so the result's `.buffer` is never a
 * SharedArrayBuffer — which the AWS SDK's request signer refuses to hash.
 */
function toNormalBytes(buf: Uint8Array): Uint8Array {
  const out = new Uint8Array(buf.byteLength)
  out.set(buf)
  return out
}

/**
 * Persist an uploaded file and return its public URL.
 * `folder` namespaces the object key (e.g. 'content' vs 'profile' photos).
 */
export async function saveMediaFile(file: File, folder: UploadKind = 'content'): Promise<SavedMedia> {
  const mime = file.type || 'application/octet-stream'
  const isVideo = mime.startsWith('video')
  const kind: 'image' | 'video' = isVideo ? 'video' : 'image'
  const input = Buffer.from(await file.arrayBuffer())

  // Images → WebP for size; video passes through untouched.
  let body: Buffer = input
  let ext = EXT_BY_TYPE[mime] ?? path.extname(file.name) ?? ''
  let contentType = mime
  if (!isVideo) {
    body = await sharp(input).webp({ quality: 82 }).toBuffer()
    ext = '.webp'
    contentType = 'image/webp'
  }

  const key = `${folder}/${randomUUID()}${ext}`

  if (r2Enabled()) {
    await r2Client().send(
      new PutObjectCommand({
        Bucket: R2.bucket!,
        Key: key,
        // The AWS SDK SHA-256-hashes the body to sign the request, and its hasher
        // rejects a Buffer backed by a SharedArrayBuffer (which file.arrayBuffer()
        // yields on the serverless runtime). Hand it bytes on a fresh, normal
        // ArrayBuffer so signing never sees a SharedArrayBuffer.
        Body: toNormalBytes(body),
        ContentType: contentType,
      }),
    )
    return { url: `${R2.publicUrl}/${key}`, kind }
  }

  // Local-disk fallback (dev): write under /public/uploads/<folder>/...
  const dir = path.join(process.cwd(), 'public', UPLOAD_SUBDIR, folder)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, path.basename(key)), body)
  return { url: `/${UPLOAD_SUBDIR}/${key}`, kind }
}
