import { z } from 'zod'
import { prisma } from '@/lib/db'
import { badRequest, ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

// §23 Bulk actions: publish / unpublish / delete / reuse (clone).
const schema = z.object({
  action: z.enum(['publish', 'unpublish', 'delete', 'reuse']),
  ids: z.array(z.string()).min(1),
})

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())
  const { action, ids } = parsed.data

  if (action === 'delete') {
    const { count } = await prisma.content.deleteMany({ where: { id: { in: ids } } })
    return ok({ affected: count })
  }

  if (action === 'publish') {
    const { count } = await prisma.content.updateMany({
      where: { id: { in: ids } },
      data: { status: 'published', publishedAt: new Date() },
    })
    return ok({ affected: count })
  }

  if (action === 'unpublish') {
    const { count } = await prisma.content.updateMany({
      where: { id: { in: ids } },
      data: { status: 'draft' },
    })
    return ok({ affected: count })
  }

  // reuse: clone each as a fresh draft.
  const sources = await prisma.content.findMany({ where: { id: { in: ids } } })
  let affected = 0
  for (const s of sources) {
    await prisma.content.create({
      data: {
        type: s.type,
        title: s.title ? `${s.title} (copy)` : null,
        mediaUrl: s.mediaUrl,
        thumbnailUrl: s.thumbnailUrl,
        categoryId: s.categoryId,
        languageId: s.languageId,
        status: 'draft',
        originalContentId: s.id,
        uploadDate: new Date(),
      },
    })
    affected++
  }
  return ok({ affected })
}
