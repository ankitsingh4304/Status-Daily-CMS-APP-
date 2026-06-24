import { z } from 'zod'
import { prisma } from '@/lib/db'
import { badRequest, notFound, ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  const { id } = await params

  const category = await prisma.category.findUnique({
    where: { id },
    include: { languages: true, _count: { select: { content: true } } },
  })
  if (!category) return notFound('Category not found')
  return ok(category)
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  iconUrl: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  languageIds: z.array(z.string()).optional(),
})

export async function PATCH(req: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  const { id } = await params

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())
  const { languageIds, ...data } = parsed.data

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...data,
      languages: languageIds ? { set: languageIds.map((lid) => ({ id: lid })) } : undefined,
    },
    include: { languages: true, _count: { select: { content: true } } },
  })
  return ok(category)
}

export async function DELETE(_req: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  const { id } = await params

  await prisma.category.delete({ where: { id } })
  return ok({ success: true })
}
