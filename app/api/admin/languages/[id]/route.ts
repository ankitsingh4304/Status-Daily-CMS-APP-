import { z } from 'zod'
import { prisma } from '@/lib/db'
import { badRequest, ok, requireAdmin } from '@/lib/api'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

const schema = z.object({
  name: z.string().min(1).optional(),
  nativeName: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  const { id } = await params

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())

  const language = await prisma.language.update({ where: { id }, data: parsed.data })
  return ok(language)
}
