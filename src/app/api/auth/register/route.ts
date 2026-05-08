// src/app/api/auth/register/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return errorResponse('Email already registered', 409)
    }

    const hashedPassword = await hashPassword(password)
    const user = await db.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    })

    const token = signToken({ userId: user.id, email: user.email })
    setAuthCookie(token)

    return successResponse({ user }, 201)
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error)
    console.error('[REGISTER_ERROR]', error)
    return errorResponse('Internal server error', 500)
  }
}
