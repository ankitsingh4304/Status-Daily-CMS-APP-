import { NextResponse } from 'next/server'

// Temporary diagnostic: confirms which commit is live and whether the media/R2
// env is present on this deployment. Reports booleans only — no secret values.
export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown',
    node: process.version,
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
      R2_ACCOUNT_ID: Boolean(process.env.R2_ACCOUNT_ID),
      R2_ACCESS_KEY_ID: Boolean(process.env.R2_ACCESS_KEY_ID),
      R2_SECRET_ACCESS_KEY: Boolean(process.env.R2_SECRET_ACCESS_KEY),
      R2_BUCKET: Boolean(process.env.R2_BUCKET),
      R2_PUBLIC_URL: Boolean(process.env.R2_PUBLIC_URL),
    },
  })
}
