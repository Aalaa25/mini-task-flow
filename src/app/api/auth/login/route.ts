// src/app/api/auth/login/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)

    const user = await db.user.findUnique({ where: { email } })
    if (!user) return errorResponse('Invalid email or password', 401)

    const valid = await comparePassword(password, user.password)
    if (!valid) return errorResponse('Invalid email or password', 401)

    const token = signToken({ userId: user.id, email: user.email })
    setAuthCookie(token)

    return successResponse({
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error)
    console.error('[LOGIN_ERROR]', error)
    return errorResponse('Internal server error', 500)
  }
}
