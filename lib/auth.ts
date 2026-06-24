import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const SESSION_COOKIE = 'sd_admin_session'
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? 'dev-only-change-me-status-daily-cms-secret-key-32chars',
)

export type AdminSession = {
  id: string
  email: string
  name: string
  role: string
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function createSession(admin: AdminSession): Promise<void> {
  const token = await new SignJWT({ ...admin })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

/** Throws a Response-like guard for API routes. Returns the session or null. */
export async function requireSession(): Promise<AdminSession | null> {
  return getSession()
}
