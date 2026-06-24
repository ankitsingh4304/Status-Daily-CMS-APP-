import { z } from 'zod'
import { prisma } from '@/lib/db'
import { badRequest, notFound, ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// §28 Moderation actions: remove content / block content / ignore report.
const schema = z.object({
  action: z.enum(['remove', 'block', 'ignore', 'resolve']),
})

export async function PATCH(req: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  const { id } = await params

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())

  const report = await prisma.report.findUnique({ where: { id } })
  if (!report) return notFound('Report not found')

  switch (parsed.data.action) {
    case 'remove':
      // delete the offending content (cascades reports), then we're done.
      await prisma.content.delete({ where: { id: report.contentId } })
      return ok({ success: true, action: 'remove' })
    case 'block':
      await prisma.content.update({ where: { id: report.contentId }, data: { isBlocked: true } })
      await prisma.report.update({ where: { id }, data: { status: 'resolved', resolvedAt: new Date() } })
      return ok({ success: true, action: 'block' })
    case 'ignore':
      await prisma.report.update({ where: { id }, data: { status: 'ignored', resolvedAt: new Date() } })
      return ok({ success: true, action: 'ignore' })
    case 'resolve':
      await prisma.report.update({ where: { id }, data: { status: 'resolved', resolvedAt: new Date() } })
      return ok({ success: true, action: 'resolve' })
  }
}
