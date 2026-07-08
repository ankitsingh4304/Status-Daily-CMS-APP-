import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

// The Prisma CLI (migrate/studio) uses this URL. It must be a DIRECT connection:
// migrations need a real session (advisory locks) which a pooled/PgBouncer
// endpoint can't provide. The app RUNTIME still uses the pooled DATABASE_URL via
// the driver adapter in lib/db.ts.
//
//  - DIRECT_URL if set (Neon "direct connection" string), else
//  - derive it from the pooled DATABASE_URL by stripping the `-pooler` host part.
function migrationUrl(): string | undefined {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL
  const pooled = process.env.DATABASE_URL
  return pooled ? pooled.replace('-pooler.', '.') : pooled
}

// Prisma 7 reads datasource URL + migration settings from here.
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: migrationUrl(),
  },
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
})
