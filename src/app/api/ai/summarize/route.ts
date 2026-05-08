// src/app/api/ai/summarize/route.ts
import { NextRequest } from 'next/server'
import https from 'node:https'
import { db } from '@/lib/db'
import { requireAuth, successResponse, errorResponse } from '@/lib/api'

function callOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'openai/gpt-oss-120b:free',
      max_tokens: 500,
      messages,
    })

    const req = https.request(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(json.choices?.[0]?.message?.content ?? '')
          } catch {
            reject(new Error('Failed to parse response'))
          }
        })
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const { projectId } = await req.json()
    if (!projectId) return errorResponse('projectId is required')

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { tasks: true },
    })

    if (!project || project.userId !== user.id) return errorResponse('Project not found', 404)

    const taskList = project.tasks.length > 0
      ? project.tasks
          .map((t) => `- [${t.status}] ${t.title}${t.description ? ': ' + t.description : ''}`)
          .join('\n')
      : null

    const prompt = taskList
      ? `Act as a senior project manager. Analyze this project and its current tasks, then write a concise executive summary. Cover overall progress, any blockers, and next priorities. Do not include any headings, labels, or formatting instructions in your response — just write the summary directly.

Project: "${project.name}"
${project.description ? `Description: ${project.description}` : ''}

Tasks:
${taskList}`
      : `Act as a senior project manager. Based on the project details below, write a concise overview of the project's purpose and recommend the two most important first steps to get started. Do not include any headings, labels, or formatting instructions in your response — just write naturally.

Project: "${project.name}"
${project.description ? `Description: ${project.description}` : ''}`


    const summary = await callOpenRouter([{ role: 'user', content: prompt }])

    return successResponse({ summary })
  } catch (err) {
    console.error('[AI_SUMMARIZE_ERROR]', err)
    return errorResponse('Failed to generate summary', 500)
  }
}
