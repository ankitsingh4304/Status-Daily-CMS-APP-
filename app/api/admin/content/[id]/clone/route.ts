import { prisma } from '@/lib/db'
import { created, notFound, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// §23 Content Reuse System — clone an existing item as a fresh draft.
export async function POST(_req: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  const { id } = await params

  const source = await prisma.content.findUnique({ where: { id } })
  if (!source) return notFound('Content not found')

  const clone = await prisma.content.create({
    data: {
      type: source.type,
      title: source.title ? `${source.title} (copy)` : null,
      mediaUrl: source.mediaUrl,
      thumbnailUrl: source.thumbnailUrl,
      categoryId: source.categoryId,
      languageId: source.languageId,
      status: 'draft',
      originalContentId: source.id,
      uploadDate: new Date(),
    },
    include: { category: { select: { name: true } }, language: { select: { name: true } } },
  })
  return created(clone)
}
