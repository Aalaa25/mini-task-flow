// src/app/api/projects/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { projectSchema } from '@/lib/validations'
import { requireAuth, successResponse, errorResponse, validationErrorResponse } from '@/lib/api'
import { ZodError } from 'zod'

// GET /api/projects — list all projects for current user
export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error

  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          tasks: true,
        },
      },
      tasks: {
        select: { status: true },
      },
    },
  })

  // Shape the response with task counts per status
  const shaped = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    taskCount: p._count.tasks,
    tasksByStatus: {
      TODO: p.tasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: p.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      DONE: p.tasks.filter((t) => t.status === 'DONE').length,
    },
  }))

  return successResponse({ projects: shaped })
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await req.json()
    const { name, description } = projectSchema.parse(body)

    const project = await db.project.create({
      data: { name, description, userId: user.id },
    })

    return successResponse({ project }, 201)
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err)
    console.error('[CREATE_PROJECT_ERROR]', err)
    return errorResponse('Internal server error', 500)
  }
}
