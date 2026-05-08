// src/app/api/projects/[id]/tasks/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { taskSchema } from '@/lib/validations'
import { requireAuth, successResponse, errorResponse, validationErrorResponse } from '@/lib/api'
import { ZodError } from 'zod'

// GET /api/projects/[id]/tasks
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const project = await db.project.findUnique({ where: { id: params.id } })
  if (!project || project.userId !== user.id) return errorResponse('Project not found', 404)

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const tasks = await db.task.findMany({
    where: {
      projectId: params.id,
      ...(status ? { status: status as 'TODO' | 'IN_PROGRESS' | 'DONE' } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse({ tasks })
}

// POST /api/projects/[id]/tasks
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const project = await db.project.findUnique({ where: { id: params.id } })
  if (!project || project.userId !== user.id) return errorResponse('Project not found', 404)

  try {
    const body = await req.json()
    const { title, description, status } = taskSchema.parse(body)

    const task = await db.task.create({
      data: { title, description, status: status ?? 'TODO', projectId: params.id },
    })

    return successResponse({ task }, 201)
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err)
    return errorResponse('Internal server error', 500)
  }
}
