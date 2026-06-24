import { NextResponse } from 'next/server'
import { getSession, type AdminSession } from './auth'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 })
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 })
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function serverError(message = 'Internal error') {
  return NextResponse.json({ error: message }, { status: 500 })
}

/**
 * Guard for admin/CMS API routes. Returns the session, or a 401 response.
 * Usage:
 *   const guard = await requireAdmin()
 *   if (guard instanceof NextResponse) return guard
 *   const admin = guard
 */
export async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const session = await getSession()
  if (!session) return unauthorized()
  return session
}
