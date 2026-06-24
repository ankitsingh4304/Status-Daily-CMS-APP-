import { z } from 'zod'
import { prisma } from '@/lib/db'
import { badRequest, notFound, ok } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

// App-facing: toggle like (§11, §12).
const schema = z.object({ userId: z.string().min(1) })

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())
  const { userId } = parsed.data

  const content = await prisma.content.findUnique({ where: { id } })
  if (!content) return notFound('Content not found')

  const existing = await prisma.like.findUnique({
    where: { userId_contentId: { userId, contentId: id } },
  })

  let liked: boolean
  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({ where: { id: existing.id } }),
      prisma.content.update({ where: { id }, data: { likeCount: { decrement: 1 } } }),
    ])
    liked = false
  } else {
    await prisma.$transaction([
      prisma.like.create({ data: { userId, contentId: id } }),
      prisma.content.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
    ])
    liked = true
  }

  const updated = await prisma.content.findUnique({ where: { id }, select: { likeCount: true } })
  return ok({ liked, likeCount: updated?.likeCount })
}
