// src/app/api/auth/me/route.ts
import { requireAuth } from '@/lib/api'
import { successResponse } from '@/lib/api'

export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error
  return successResponse({ user })
}
