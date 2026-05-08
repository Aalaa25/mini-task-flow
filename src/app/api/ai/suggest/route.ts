// src/app/api/ai/suggest/route.ts
import { NextRequest } from 'next/server'
import https from 'node:https'
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
            resolve(json.choices?.[0]?.message?.content ?? '[]')
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
    const { projectName, projectDescription } = await req.json()
    if (!projectName) return errorResponse('projectName is required')

    const raw = await callOpenRouter([
      {
        role: 'user',
        content: `You are a project management assistant. Suggest 5 practical tasks for this project.

Project: "${projectName}"
${projectDescription ? `Description: ${projectDescription}` : ''}

Return ONLY a JSON array of 5 task objects with "title" and "description" fields. No other text.
Example: [{"title":"Set up repository","description":"Initialize git repo and project structure"}]`,
      },
    ])

    const clean = raw.replace(/```json|```/g, '').trim()
    const tasks = JSON.parse(clean)

    return successResponse({ tasks })
  } catch (err) {
    console.error('[AI_SUGGEST_ERROR]', err)
    return errorResponse('Failed to generate suggestions', 500)
  }
}
