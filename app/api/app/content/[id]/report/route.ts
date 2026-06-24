import { z } from 'zod'
import { prisma } from '@/lib/db'
import { badRequest, created, notFound } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

// App-facing: report content (§11, §28).
const schema = z.object({
  reason: z.string().min(1),
  userId: z.string().optional(),
})

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())

  const content = await prisma.content.findUnique({ where: { id } })
  if (!content) return notFound('Content not found')

  await prisma.$transaction([
    prisma.report.create({
      data: { contentId: id, reason: parsed.data.reason, userId: parsed.data.userId ?? null },
    }),
    prisma.content.update({ where: { id }, data: { reportCount: { increment: 1 } } }),
  ])

  return created({ success: true })
}
