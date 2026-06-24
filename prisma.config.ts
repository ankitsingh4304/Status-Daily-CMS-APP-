import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Prisma 7 reads datasource URL + migration settings from here.
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
})
