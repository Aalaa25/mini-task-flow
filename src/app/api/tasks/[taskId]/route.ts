// src/app/api/tasks/[taskId]/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { taskSchema } from '@/lib/validations'
import { requireAuth, successResponse, errorResponse, validationErrorResponse } from '@/lib/api'
import { ZodError } from 'zod'

async function getTaskForUser(taskId: string, userId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  })
  if (!task || task.project.userId !== userId) return null
  return task
}

// GET /api/tasks/[taskId]
export async function GET(_req: NextRequest, { params }: { params: { taskId: string } }) {
  const { user, error } = await requireAuth()
  if (error) return error

  const task = await getTaskForUser(params.taskId, user.id)
  if (!task) return errorResponse('Task not found', 404)

  return successResponse({ task })
}

// PUT /api/tasks/[taskId]
export async function PUT(req: NextRequest, { params }: { params: { taskId: string } }) {
  const { user, error } = await requireAuth()
  if (error) return error

  const existing = await getTaskForUser(params.taskId, user.id)
  if (!existing) return errorResponse('Task not found', 404)

  try {
    const body = await req.json()
    const { title, description, status } = taskSchema.parse(body)

    const updated = await db.task.update({
      where: { id: params.taskId },
      data: { title, description, status },
    })

    return successResponse({ task: updated })
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err)
    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/tasks/[taskId]
export async function DELETE(_req: NextRequest, { params }: { params: { taskId: string } }) {
  const { user, error } = await requireAuth()
  if (error) return error

  const existing = await getTaskForUser(params.taskId, user.id)
  if (!existing) return errorResponse('Task not found', 404)

  await db.task.delete({ where: { id: params.taskId } })

  return successResponse({ message: 'Task deleted' })
}
