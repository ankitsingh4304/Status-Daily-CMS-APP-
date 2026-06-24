/**
 * Production seed — config only, NO fake data.
 *
 * Idempotently ensures the things the CMS needs to function exist:
 *   - one admin login
 *   - the supported languages
 *   - the blueprint categories (published, mapped to all languages)
 *
 * It creates NO users, NO content, and NO engagement — those must come from
 * real usage. Safe to run anytime; it upserts and never deletes real data.
 *
 *   npm run db:seed
 *
 * (For a throwaway demo dataset with fake users/shares, see git history of this
 *  file — the demo seed was retired so dashboards always reflect real activity.)
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import { SEED_LANGUAGES, SEED_CATEGORIES } from '../lib/constants'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding config (admin, languages, categories)…')

  // --- Admin (change the password after first login in production) ---
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.admin.upsert({
    where: { email: 'admin@statusdaily.app' },
    update: {},
    create: {
      email: 'admin@statusdaily.app',
      name: 'Status Admin',
      role: 'superadmin',
      passwordHash,
    },
  })
  console.log('  ✓ admin: admin@statusdaily.app / admin123')

  // --- Languages ---
  for (const l of SEED_LANGUAGES) {
    await prisma.language.upsert({
      where: { code: l.code },
      update: { name: l.name, nativeName: l.nativeName, sortOrder: l.sortOrder },
      create: { code: l.code, name: l.name, nativeName: l.nativeName, sortOrder: l.sortOrder },
    })
  }
  const languages = await prisma.language.findMany()
  console.log(`  ✓ ${languages.length} languages`)

  // --- Categories (published, mapped to all languages) ---
  for (let i = 0; i < SEED_CATEGORIES.length; i++) {
    const c = SEED_CATEGORIES[i]
    await prisma.category.upsert({
      where: { key: c.key },
      update: {},
      create: {
        key: c.key,
        name: c.name,
        isPublished: true,
        sortOrder: i + 1,
        languages: { connect: languages.map((l) => ({ id: l.id })) },
      },
    })
  }
  console.log(`  ✓ ${SEED_CATEGORIES.length} categories`)

  console.log('✅ Config seed complete (no fake users/content/engagement).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
