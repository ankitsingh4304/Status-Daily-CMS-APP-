import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Prisma 7 requires a driver adapter at runtime. We run on Postgres (Neon in
// production, any Postgres locally). DATABASE_URL is the Postgres connection
// string — on Vercel + Neon use the POOLED connection string (host contains
// `-pooler`) so serverless functions don't exhaust connections.
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — point it at a Postgres instance.')
}

const adapter = new PrismaPg({ connectionString })

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
