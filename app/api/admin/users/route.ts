import { prisma } from '@/lib/db'
import { ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

// §26 Admin User Table.
export async function GET(req: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const url = new URL(req.url)
  const q = url.searchParams
  const where: Record<string, unknown> = {}
  if (q.get('premium') === 'true') where.isPremium = true
  if (q.get('languageId')) where.languageId = q.get('languageId')
  if (q.get('search')) {
    where.OR = [
      { name: { contains: q.get('search')! } },
      { mobile: { contains: q.get('search')! } },
    ]
  }

  const page = Math.max(1, Number(q.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(q.get('pageSize') ?? 25)))

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { registeredAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        language: { select: { name: true, code: true } },
        _count: { select: { shares: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return ok({ items: users, total, page, pageSize, pages: Math.ceil(total / pageSize) })
}
