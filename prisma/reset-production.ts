/**
 * One-off: strip all DEMO/fake data so the CMS reflects only real activity.
 *
 * Deletes: every app user, share, like, report, and activity event (all fake),
 * plus seeded sample content (picsum placeholders). KEEPS: admin login,
 * languages, categories, and any real admin-uploaded content (mediaUrl under
 * /uploads) — with its engagement counters reset to zero.
 *
 * Run once:  npx tsx prisma/reset-production.ts
 * Safe to re-run (idempotent).
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set — point it at your Postgres (Neon) instance.')
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Resetting to real-data-only…')

  // 1) Wipe all engagement + users (every row here was demo/fake).
  const ev = await prisma.activityEvent.deleteMany()
  const rp = await prisma.report.deleteMany()
  const sh = await prisma.shareEvent.deleteMany()
  const lk = await prisma.like.deleteMany()
  const us = await prisma.user.deleteMany()
  console.log(`  ✓ deleted ${us.count} users, ${sh.count} shares, ${lk.count} likes, ${rp.count} reports, ${ev.count} activity events`)

  // 2) Remove seeded sample content (anything NOT a real /uploads file).
  const seeded = await prisma.content.deleteMany({
    where: { NOT: { mediaUrl: { startsWith: '/uploads' } } },
  })
  console.log(`  ✓ deleted ${seeded.count} seeded sample templates`)

  // 3) Zero engagement counters on remaining real content.
  const reset = await prisma.content.updateMany({
    data: { shareCount: 0, likeCount: 0, reportCount: 0 },
  })
  const remaining = await prisma.content.count()
  console.log(`  ✓ reset counters on ${reset.count} remaining content item(s); ${remaining} real item(s) kept`)

  // 4) Clear fake placeholder category icons (picsum); categories themselves stay.
  await prisma.category.updateMany({
    where: { iconUrl: { contains: 'picsum' } },
    data: { iconUrl: null },
  })

  const [users, shares, content, cats, langs] = await Promise.all([
    prisma.user.count(),
    prisma.shareEvent.count(),
    prisma.content.count(),
    prisma.category.count(),
    prisma.language.count(),
  ])
  console.log(`\n📊 Now: users=${users}, shares=${shares}, content=${content}, categories=${cats}, languages=${langs}`)
  console.log('✅ Done — dashboards now show real data only.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
