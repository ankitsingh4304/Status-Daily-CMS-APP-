import { prisma } from '@/lib/db'
import { ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

// §28 Report & Moderation queue.
export async function GET(req: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const url = new URL(req.url)
  const status = url.searchParams.get('status') // pending | resolved | ignored

  const reports = await prisma.report.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, mobile: true } },
      content: {
        select: {
          id: true, title: true, type: true, thumbnailUrl: true, mediaUrl: true,
          isBlocked: true, reportCount: true, category: { select: { name: true } },
        },
      },
    },
  })
  return ok(reports)
}
