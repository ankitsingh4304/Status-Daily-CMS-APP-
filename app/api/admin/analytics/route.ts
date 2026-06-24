import { prisma } from '@/lib/db'
import { ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

// §27 Analytics Dashboard: user / content / platform analytics.
export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const since1 = new Date(now - day)
  const since30 = new Date(now - 30 * day)

  // DAU / MAU (distinct active users from activity log).
  const [dauRows, mauRows] = await Promise.all([
    prisma.activityEvent.findMany({
      where: { createdAt: { gte: since1 } },
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.activityEvent.findMany({
      where: { createdAt: { gte: since30 } },
      distinct: ['userId'],
      select: { userId: true },
    }),
  ])
  const dau = dauRows.length
  const mau = mauRows.length

  // 7-day share trend.
  const shareTrend: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const start = new Date(now - (i + 1) * day)
    const end = new Date(now - i * day)
    const count = await prisma.shareEvent.count({
      where: { createdAt: { gte: start, lt: end } },
    })
    shareTrend.push({ date: end.toISOString().slice(5, 10), count })
  }

  // Most active users (by activity count).
  const activeAgg = await prisma.activityEvent.groupBy({
    by: ['userId'],
    _count: { userId: true },
    orderBy: { _count: { userId: 'desc' } },
    take: 8,
  })
  const activeUserIds = activeAgg.map((a) => a.userId)
  const activeUserRecords = await prisma.user.findMany({
    where: { id: { in: activeUserIds } },
    select: { id: true, name: true, mobile: true, isPremium: true },
  })
  const mostActiveUsers = activeAgg.map((a) => {
    const u = activeUserRecords.find((r) => r.id === a.userId)
    return { name: u?.name ?? 'Unknown', mobile: u?.mobile ?? '', events: a._count.userId, isPremium: u?.isPremium ?? false }
  })

  // Most shared content.
  const mostShared = await prisma.content.findMany({
    orderBy: { shareCount: 'desc' },
    take: 8,
    select: {
      id: true, title: true, type: true, shareCount: true, likeCount: true,
      thumbnailUrl: true, category: { select: { name: true } }, language: { select: { name: true } },
    },
  })

  // Top category + language by shares.
  const [catAgg, langAgg, platformAgg] = await Promise.all([
    prisma.content.groupBy({ by: ['categoryId'], _sum: { shareCount: true } }),
    prisma.content.groupBy({ by: ['languageId'], _sum: { shareCount: true } }),
    prisma.shareEvent.groupBy({ by: ['platform'], _count: { platform: true } }),
  ])

  const catNames = await prisma.category.findMany({ select: { id: true, name: true } })
  const langNames = await prisma.language.findMany({ select: { id: true, name: true } })

  const topCategories = catAgg
    .map((c) => ({ name: catNames.find((n) => n.id === c.categoryId)?.name ?? '—', shares: c._sum.shareCount ?? 0 }))
    .sort((a, b) => b.shares - a.shares)
    .slice(0, 6)
  const topLanguages = langAgg
    .map((l) => ({ name: langNames.find((n) => n.id === l.languageId)?.name ?? '—', shares: l._sum.shareCount ?? 0 }))
    .sort((a, b) => b.shares - a.shares)
  const platforms = platformAgg
    .map((p) => ({ platform: p.platform, count: p._count.platform }))
    .sort((a, b) => b.count - a.count)

  return ok({
    dau,
    mau,
    retention: mau > 0 ? Math.round((dau / mau) * 100) : 0,
    shareTrend,
    mostActiveUsers,
    mostShared,
    topCategories,
    topLanguages,
    platforms,
  })
}
