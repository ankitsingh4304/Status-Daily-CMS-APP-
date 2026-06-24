import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// Prisma 7 requires a driver adapter at runtime. The SQLite adapter takes the
// same URL we use for migrations. To move to Postgres, swap this for
// `@prisma/adapter-pg` (new PrismaPg({ connectionString })) — nothing else changes.
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
})

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
