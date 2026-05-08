// src/app/api/projects/[id]/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { projectSchema } from '@/lib/validations'
import { requireAuth, successResponse, errorResponse, validationErrorResponse } from '@/lib/api'
import { ZodError } from 'zod'

async function getProjectForUser(id: string, userId: string) {
  const project = await db.project.findUnique({ where: { id } })
  if (!project) return null
  if (project.userId !== userId) return null
  return project
}

// GET /api/projects/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth()
  if (error) return error

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      tasks: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!project || project.userId !== user.id) return errorResponse('Project not found', 404)

  return successResponse({ project })
}

// PUT /api/projects/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth()
  if (error) return error

  const existing = await getProjectForUser(params.id, user.id)
  if (!existing) return errorResponse('Project not found', 404)

  try {
    const body = await req.json()
    const { name, description } = projectSchema.parse(body)

    const updated = await db.project.update({
      where: { id: params.id },
      data: { name, description },
    })

    return successResponse({ project: updated })
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err)
    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/projects/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth()
  if (error) return error

  const existing = await getProjectForUser(params.id, user.id)
  if (!existing) return errorResponse('Project not found', 404)

  await db.project.delete({ where: { id: params.id } })

  return successResponse({ message: 'Project deleted' })
}
