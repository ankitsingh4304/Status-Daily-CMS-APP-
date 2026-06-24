import { z } from 'zod'
import { prisma } from '@/lib/db'
import { badRequest, ok } from '@/lib/api'

// App-facing: register / upsert an app user after OTP login (§14).
// The mobile app calls this once it has a verified mobile number.
const schema = z.object({
  mobile: z.string().min(6),
  name: z.string().optional(),
  photoUrl: z.string().optional(),
  languageCode: z.string().optional(),
  deviceInfo: z.string().optional(),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten())
  const { mobile, name, photoUrl, languageCode, deviceInfo } = parsed.data

  const language = languageCode
    ? await prisma.language.findUnique({ where: { code: languageCode } })
    : null

  const user = await prisma.user.upsert({
    where: { mobile },
    create: {
      mobile,
      name,
      photoUrl,
      deviceInfo,
      languageId: language?.id,
    },
    update: {
      name,
      photoUrl,
      deviceInfo,
      languageId: language?.id,
      lastActiveAt: new Date(),
    },
    include: { language: { select: { code: true, name: true } } },
  })

  return ok(user)
}
