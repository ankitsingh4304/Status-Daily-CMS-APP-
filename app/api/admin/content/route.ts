import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { badRequest, created, ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

// §21/§22/§24 Content management with filters (day/month/year/category/language/type/status).
export async function GET(req: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const url = new URL(req.url)
  const q = url.searchParams
  const where: Prisma.ContentWhereInput = {}

  if (q.get('categoryId')) where.categoryId = q.get('categoryId')!
  if (q.get('languageId')) where.languageId = q.get('languageId')!
  if (q.get('type')) where.type = q.get('type')!
  if (q.get('status')) where.status = q.get('status')!
  if (q.get('search')) where.title = { contains: q.get('search')! }

  // Date filter by day/month/year on uploadDate.
  const year = q.get('year')
  const month = q.get('month') // 1-12
  const day = q.get('day')
  if (year) {
    const y = Number(year)
    const m = month ? Number(month) - 1 : 0
    const d = day ? Number(day) : 1
    let start: Date
    let end: Date
    if (day && month) {
      start = new Date(y, m, d)
      end = new Date(y, m, d + 1)
    } else if (month) {
      start = new Date(y, m, 1)
      end = new Date(y, m + 1, 1)
    } else {
      start = new Date(y, 0, 1)
      end = new Date(y + 1, 0, 1)
    }
    where.uploadDate = { gte: start, lt: end }
  }

  const page = Math.max(1, Number(q.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(q.get('pageSize') ?? 24)))

  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { uploadDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true } },
        language: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.content.count({ where }),
  ])

  return ok({ items, total, page, pageSize, pages: Math.ceil(total / pageSize) })
}

const createSchema = z.object({
  type: z.enum(['image', 'video']),
  title: z.string().optional().nullable(),
  mediaUrl: z.string().min(1),
  thumbnailUrl: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  languageId: z.string().min(1),
  status: z.enum(['draft', 'published']).optional(),
  isTrending: z.boolean().optional(),
})

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())

  const data = parsed.data
  const content = await prisma.content.create({
    data: {
      ...data,
      publishedAt: data.status === 'published' ? new Date() : null,
    },
    include: { category: { select: { name: true } }, language: { select: { name: true } } },
  })
  return created(content)
}
