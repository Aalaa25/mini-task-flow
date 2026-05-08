// src/lib/api.ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getCurrentUser } from './auth'

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function validationErrorResponse(error: ZodError) {
  const message = error.errors.map((e) => e.message).join(', ')
  return errorResponse(message, 422)
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    return { user: null, error: errorResponse('Unauthorized', 401) }
  }
  return { user, error: null }
}
