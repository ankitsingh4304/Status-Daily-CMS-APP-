import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import {
  SEED_LANGUAGES,
  SEED_CATEGORIES,
  SHARE_PLATFORMS,
} from '../lib/constants'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
})
const prisma = new PrismaClient({ adapter })

// Deterministic-ish helpers (seed data only).
const pick = <T>(arr: readonly T[], i: number) => arr[i % arr.length]
const rand = (n: number) => Math.floor(Math.random() * n)
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000)

const SAMPLE_IMAGE = (s: string) => `https://picsum.photos/seed/${s}/720/1280`
const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Priya', 'Ananya', 'Diya', 'Aadhya', 'Kavya', 'Riya', 'Pooja', 'Sneha',
  'Rahul', 'Amit', 'Suresh', 'Lakshmi', 'Meena', 'Deepak', 'Kiran', 'Manoj',
]
const REPORT_REASONS = [
  'Inappropriate content',
  'Wrong language',
  'Poor quality',
  'Offensive',
  'Copyright',
]

async function main() {
  console.log('🌱 Seeding Status Daily CMS...')

  // Clean (idempotent reseed) — order respects FKs.
  await prisma.activityEvent.deleteMany()
  await prisma.report.deleteMany()
  await prisma.shareEvent.deleteMany()
  await prisma.like.deleteMany()
  await prisma.content.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.language.deleteMany()
  await prisma.admin.deleteMany()

  // --- Admin ---
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.admin.create({
    data: {
      email: 'admin@statusdaily.app',
      name: 'Status Admin',
      role: 'superadmin',
      passwordHash,
    },
  })
  console.log('  ✓ admin: admin@statusdaily.app / admin123')

  // --- Languages ---
  const languages = []
  for (const l of SEED_LANGUAGES) {
    languages.push(
      await prisma.language.create({
        data: { code: l.code, name: l.name, nativeName: l.nativeName, sortOrder: l.sortOrder },
      }),
    )
  }
  console.log(`  ✓ ${languages.length} languages`)

  // --- Categories (each mapped to first 4 languages, published) ---
  const categories = []
  for (let i = 0; i < SEED_CATEGORIES.length; i++) {
    const c = SEED_CATEGORIES[i]
    categories.push(
      await prisma.category.create({
        data: {
          key: c.key,
          name: c.name,
          isPublished: i % 7 !== 6, // most published, a couple unpublished
          sortOrder: i + 1,
          iconUrl: SAMPLE_IMAGE(`cat-${c.key}`),
          languages: {
            connect: languages.slice(0, 4).map((l) => ({ id: l.id })),
          },
        },
      }),
    )
  }
  console.log(`  ✓ ${categories.length} categories`)

  // --- Content: ~6 per category, mix of image/video, mostly published ---
  const contents = []
  for (const cat of categories) {
    for (let j = 0; j < 6; j++) {
      const isVideo = j % 4 === 3
      const langId = pick(languages, j).id
      const published = j % 5 !== 4
      contents.push(
        await prisma.content.create({
          data: {
            type: isVideo ? 'video' : 'image',
            title: `${cat.name} ${j + 1}`,
            mediaUrl: isVideo ? SAMPLE_VIDEO : SAMPLE_IMAGE(`${cat.key}-${j}`),
            thumbnailUrl: SAMPLE_IMAGE(`${cat.key}-${j}-thumb`),
            categoryId: cat.id,
            languageId: langId,
            status: published ? 'published' : 'draft',
            publishedAt: published ? daysAgo(rand(120)) : null,
            isTrending: j === 0,
            shareCount: rand(500),
            likeCount: rand(1200),
            uploadDate: daysAgo(rand(200)),
          },
        }),
      )
    }
  }
  console.log(`  ✓ ${contents.length} content items`)

  // --- App users ---
  const users = []
  for (let i = 0; i < 40; i++) {
    const lang = pick(languages, i)
    users.push(
      await prisma.user.create({
        data: {
          mobile: `9${String(100000000 + i * 13337).slice(0, 9)}`,
          name: `${pick(FIRST_NAMES, i)}`,
          languageId: lang.id,
          isPremium: i % 5 === 0,
          deviceInfo: JSON.stringify({ os: i % 2 ? 'Android 13' : 'Android 12', model: 'Redmi' }),
          registeredAt: daysAgo(rand(300) + 1),
          lastActiveAt: daysAgo(rand(20)),
        },
      }),
    )
  }
  console.log(`  ✓ ${users.length} app users`)

  // --- Engagement: shares, likes, reports, activity ---
  let shares = 0
  let likes = 0
  for (let i = 0; i < 600; i++) {
    const content = pick(contents, rand(contents.length))
    const user = pick(users, rand(users.length))
    const platform = pick(SHARE_PLATFORMS, rand(SHARE_PLATFORMS.length))
    await prisma.shareEvent.create({
      data: { contentId: content.id, userId: user.id, platform, createdAt: daysAgo(rand(60)) },
    })
    await prisma.activityEvent.create({
      data: { userId: user.id, type: 'share', contentId: content.id, platform, createdAt: daysAgo(rand(60)) },
    })
    shares++
  }
  for (let i = 0; i < 800; i++) {
    const content = pick(contents, rand(contents.length))
    const user = pick(users, rand(users.length))
    try {
      await prisma.like.create({ data: { contentId: content.id, userId: user.id } })
      likes++
    } catch {
      // unique(user, content) collision — skip
    }
  }
  // category views + sessions
  for (let i = 0; i < 1000; i++) {
    const user = pick(users, rand(users.length))
    const cat = pick(categories, rand(categories.length))
    await prisma.activityEvent.create({
      data: {
        userId: user.id,
        type: i % 3 === 0 ? 'session' : 'category_view',
        categoryId: cat.id,
        sessionSeconds: i % 3 === 0 ? 30 + rand(600) : null,
        createdAt: daysAgo(rand(30)),
      },
    })
  }
  // reports (some pending for the moderation queue)
  let reports = 0
  for (let i = 0; i < 18; i++) {
    const content = pick(contents, rand(contents.length))
    const user = pick(users, rand(users.length))
    await prisma.report.create({
      data: {
        contentId: content.id,
        userId: user.id,
        reason: pick(REPORT_REASONS, rand(REPORT_REASONS.length)),
        status: i % 3 === 0 ? 'pending' : pick(['resolved', 'ignored', 'pending'], i),
        createdAt: daysAgo(rand(20)),
      },
    })
    await prisma.content.update({
      where: { id: content.id },
      data: { reportCount: { increment: 1 } },
    })
    reports++
  }
  console.log(`  ✓ engagement: ${shares} shares, ${likes} likes, ${reports} reports, activity events`)

  console.log('✅ Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
