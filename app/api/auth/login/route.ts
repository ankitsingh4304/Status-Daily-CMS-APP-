import { z } from 'zod'
import { prisma } from '@/lib/db'
import { createSession, verifyPassword } from '@/lib/auth'
import { badRequest, ok, unauthorized } from '@/lib/api'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())

  const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email } })
  if (!admin) return unauthorized('Invalid email or password')

  const valid = await verifyPassword(parsed.data.password, admin.passwordHash)
  if (!valid) return unauthorized('Invalid email or password')

  await createSession({ id: admin.id, email: admin.email, name: admin.name, role: admin.role })
  return ok({ id: admin.id, email: admin.email, name: admin.name, role: admin.role })
}
