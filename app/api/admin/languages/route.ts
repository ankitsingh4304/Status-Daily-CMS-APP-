import { z } from 'zod'
import { prisma } from '@/lib/db'
import { badRequest, created, ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const languages = await prisma.language.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { content: true, users: true, categories: true } } },
  })
  return ok(languages)
}

const schema = z.object({
  code: z.string().min(2).max(8),
  name: z.string().min(1),
  nativeName: z.string().min(1),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())

  const exists = await prisma.language.findUnique({ where: { code: parsed.data.code } })
  if (exists) return badRequest('Language code already exists')

  const language = await prisma.language.create({ data: parsed.data })
  return created(language)
}
