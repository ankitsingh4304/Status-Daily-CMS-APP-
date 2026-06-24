import { z } from 'zod'
import { prisma } from '@/lib/db'
import { badRequest, notFound, ok } from '@/lib/api'
import { SHARE_PLATFORMS } from '@/lib/constants'

type Params = { params: Promise<{ id: string }> }

// App-facing: record a share (§11, §12). Increments public share count.
const schema = z.object({
  platform: z.enum(SHARE_PLATFORMS),
  userId: z.string().nullish(),
})

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())

  const content = await prisma.content.findUnique({ where: { id } })
  if (!content) return notFound('Content not found')

  await prisma.$transaction([
    prisma.shareEvent.create({
      data: { contentId: id, platform: parsed.data.platform, userId: parsed.data.userId ?? null },
    }),
    prisma.content.update({ where: { id }, data: { shareCount: { increment: 1 } } }),
    ...(parsed.data.userId
      ? [
          prisma.activityEvent.create({
            data: { userId: parsed.data.userId, type: 'share', contentId: id, platform: parsed.data.platform },
          }),
          prisma.user.update({ where: { id: parsed.data.userId }, data: { lastActiveAt: new Date() } }),
        ]
      : []),
  ])

  const updated = await prisma.content.findUnique({ where: { id }, select: { shareCount: true } })
  return ok({ success: true, shareCount: updated?.shareCount })
}
