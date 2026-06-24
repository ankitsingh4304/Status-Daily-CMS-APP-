import { z } from 'zod'
import { prisma } from '@/lib/db'
import { badRequest, created, ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      languages: { select: { id: true, code: true, name: true } },
      _count: { select: { content: true } },
    },
  })
  return ok(categories)
}

const createSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_]+$/, 'lowercase letters, numbers, underscore only'),
  name: z.string().min(1),
  iconUrl: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  languageIds: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())
  const { languageIds, ...data } = parsed.data

  const exists = await prisma.category.findUnique({ where: { key: data.key } })
  if (exists) return badRequest('A category with this key already exists')

  const category = await prisma.category.create({
    data: {
      ...data,
      languages: languageIds ? { connect: languageIds.map((id) => ({ id })) } : undefined,
    },
    include: { languages: true, _count: { select: { content: true } } },
  })
  return created(category)
}
