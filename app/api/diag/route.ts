import { NextResponse } from 'next/server'

// Diagnostic (real route — no underscore, so it is actually served): reports the
// live commit + which storage-conversion build is deployed. Booleans only.
export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    node: process.version,
    storageFix: 'r2-normal-bytes', // marker string; changes when this build recompiles
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      R2_ACCOUNT_ID: Boolean(process.env.R2_ACCOUNT_ID),
      R2_BUCKET: Boolean(process.env.R2_BUCKET),
      R2_PUBLIC_URL: Boolean(process.env.R2_PUBLIC_URL),
    },
  })
}
