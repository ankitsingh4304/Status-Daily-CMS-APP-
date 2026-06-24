import { prisma } from '@/lib/db'
import { ok } from '@/lib/api'

// App-facing randomized feed (§6, §25).
// GET /api/app/feed?lang=hi&category=love&seed=12345&page=1&pageSize=15
// - only published, non-blocked content
// - shuffled per session (stable for a given seed so pagination is consistent)
// - trending content gets weighted priority

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const lang = q.get('lang')
  const category = q.get('category') // category key
  const seedStr = q.get('seed') ?? 'default'
  const page = Math.max(1, Number(q.get('page') ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(q.get('pageSize') ?? 15)))

  const candidates = await prisma.content.findMany({
    where: {
      status: 'published',
      isBlocked: false,
      ...(lang ? { language: { code: lang } } : {}),
      ...(category ? { category: { key: category } } : {}),
    },
    select: { id: true, isTrending: true },
  })

  // Weighted seeded shuffle: trending items get a head-start.
  const rng = mulberry32(seedFromString(seedStr))
  const ordered = candidates
    .map((c) => ({ id: c.id, key: rng() - (c.isTrending ? 0.35 : 0) }))
    .sort((a, b) => a.key - b.key)

  const total = ordered.length
  const slice = ordered.slice((page - 1) * pageSize, page * pageSize)

  const records = await prisma.content.findMany({
    where: { id: { in: slice.map((s) => s.id) } },
    include: {
      category: { select: { key: true, name: true } },
      language: { select: { code: true, name: true } },
    },
  })
  // Preserve shuffled order.
  const byId = new Map(records.map((r) => [r.id, r]))
  const items = slice.map((s) => byId.get(s.id)).filter(Boolean)

  return ok({ items, page, pageSize, total, pages: Math.ceil(total / pageSize), seed: seedStr })
}
