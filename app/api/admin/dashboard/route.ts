import { prisma } from '@/lib/db'
import { ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

// §17.1 CMS Dashboard cards.
export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    premiumUsers,
    activeUsers,
    totalShares,
    totalCategories,
    totalContent,
    sharesByCategory,
    sharesByLanguage,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPremium: true } }),
    prisma.user.count({ where: { lastActiveAt: { gte: since30 } } }),
    prisma.shareEvent.count(),
    prisma.category.count(),
    prisma.content.count(),
    prisma.content.groupBy({ by: ['categoryId'], _sum: { shareCount: true } }),
    prisma.content.groupBy({ by: ['languageId'], _sum: { shareCount: true } }),
  ])

  // Resolve top category + language names.
  const topCatAgg = [...sharesByCategory].sort(
    (a, b) => (b._sum.shareCount ?? 0) - (a._sum.shareCount ?? 0),
  )[0]
  const topLangAgg = [...sharesByLanguage].sort(
    (a, b) => (b._sum.shareCount ?? 0) - (a._sum.shareCount ?? 0),
  )[0]

  const [topCategory, topLanguage] = await Promise.all([
    topCatAgg
      ? prisma.category.findUnique({ where: { id: topCatAgg.categoryId }, select: { name: true } })
      : null,
    topLangAgg
      ? prisma.language.findUnique({ where: { id: topLangAgg.languageId }, select: { name: true } })
      : null,
  ])

  return ok({
    totalUsers,
    premiumUsers,
    activeUsers,
    totalShares,
    totalCategories,
    totalContent,
    topCategory: topCategory?.name ?? '—',
    topLanguage: topLanguage?.name ?? '—',
  })
}
