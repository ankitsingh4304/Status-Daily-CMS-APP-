import { z } from 'zod'
import { prisma } from '@/lib/db'
import { badRequest, notFound, ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  const { id } = await params

  const content = await prisma.content.findUnique({
    where: { id },
    include: { category: true, language: true },
  })
  if (!content) return notFound('Content not found')
  return ok(content)
}

const patchSchema = z.object({
  title: z.string().optional().nullable(),
  mediaUrl: z.string().optional(),
  thumbnailUrl: z.string().optional().nullable(),
  categoryId: z.string().optional(),
  languageId: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  isTrending: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  const { id } = await params

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())

  const current = await prisma.content.findUnique({ where: { id } })
  if (!current) return notFound('Content not found')

  const data = parsed.data
  // Stamp publishedAt the first time it transitions to published.
  const publishedAt =
    data.status === 'published' && current.status !== 'published'
      ? new Date()
      : undefined

  const content = await prisma.content.update({
    where: { id },
    data: { ...data, ...(publishedAt ? { publishedAt } : {}) },
    include: { category: { select: { name: true } }, language: { select: { name: true } } },
  })
  return ok(content)
}

export async function DELETE(_req: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  const { id } = await params

  await prisma.content.delete({ where: { id } })
  return ok({ success: true })
}
