'use client'
// src/app/dashboard/projects/[id]/page.tsx
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  createdAt: string
}

interface Project {
  id: string
  name: string
  description?: string
  tasks: Task[]
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

const STATUS_ORDER: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'TODO' as TaskStatus })
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<{ title: string; description: string }[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false)
  const [editProject, setEditProject] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${id}`)
    if (!res.ok) { router.push('/dashboard'); return }
    const data = await res.json()
    setProject(data.data.project)
    setLoading(false)
  }

  useEffect(() => { fetchProject() }, [id])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch(`/api/projects/${id}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskForm),
    })
    if (res.ok) {
      setTaskForm({ title: '', description: '', status: 'TODO' })
      setShowTaskForm(false)
      await fetchProject()
    }
    setSubmitting(false)
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTask) return
    setSubmitting(true)
    await fetch(`/api/tasks/${editTask.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTask.title, description: editTask.description, status: editTask.status }),
    })
    setEditTask(null)
    await fetchProject()
    setSubmitting(false)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    await fetchProject()
  }

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: task.title, description: task.description, status }),
    })
    await fetchProject()
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(`/api/projects/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectForm),
    })
    setEditProject(false)
    await fetchProject()
  }

  const handleAISummary = async () => {
    setAiLoading(true)
    setAiSummary('')
    const res = await fetch('/api/ai/summarize', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id }),
    })
    const data = await res.json()
    if (res.ok) setAiSummary(data.data.summary)
    else setAiSummary('Failed to generate summary. Make sure OPENROUTER_API_KEY is set.')
    setAiLoading(false)
  }

  const handleAISuggest = async () => {
    setAiSuggestLoading(true)
    setAiSuggestions([])
    const res = await fetch('/api/ai/suggest', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName: project?.name, projectDescription: project?.description }),
    })
    const data = await res.json()
    if (res.ok) setAiSuggestions(data.data.tasks)
    setAiSuggestLoading(false)
  }

  const addSuggestedTask = async (task: { title: string; description: string }) => {
    await fetch(`/api/projects/${id}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status: 'TODO' }),
    })
    await fetchProject()
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 80 }}>Loading...</div>
  if (!project) return null

  const filteredTasks = filter === 'ALL' ? project.tasks : project.tasks.filter(t => t.status === filter)

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← Back to projects
      </Link>

      {/* Project Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{project.name}</h1>
          {project.description && <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>{project.description}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {STATUS_ORDER.map(s => {
              const count = project.tasks.filter(t => t.status === s).length
              const cls = s === 'TODO' ? 'badge-todo' : s === 'IN_PROGRESS' ? 'badge-inprogress' : 'badge-done'
              return <span key={s} className={cls} style={badgeStyle}>{count} {STATUS_LABELS[s]}</span>
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => { setProjectForm({ name: project.name, description: project.description ?? '' }); setEditProject(true) }} style={btnSecondary}>
            ✏️ Edit
          </button>
          <button onClick={() => setShowTaskForm(true)} style={btnPrimary}>+ Add Task</button>
        </div>
      </div>

      {/* AI Panel */}
      <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, padding: 20, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <span style={{ fontWeight: 600, color: 'var(--brand-light)', fontSize: 15 }}>AI Assistant</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleAISummary} disabled={aiLoading} style={btnAi}>
            {aiLoading ? '⏳ Generating...' : '📊 Summarize Project'}
          </button>
          <button onClick={handleAISuggest} disabled={aiSuggestLoading} style={btnAi}>
            {aiSuggestLoading ? '⏳ Thinking...' : '💡 Suggest Tasks'}
          </button>
        </div>
        {aiSummary && (
          <div style={{ marginTop: 14, padding: 14, background: 'rgba(0,0,0,0.3)', borderRadius: 8,
            color: 'var(--text)', fontSize: 14, lineHeight: 1.6, borderLeft: '3px solid var(--brand)' }}>
            {aiSummary}
          </div>
        )}
        {aiSuggestions.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Suggested tasks — click to add:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {aiSuggestions.map((s, i) => (
                <button key={i} onClick={() => addSuggestedTask(s)} style={{
                  textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px', color: 'var(--text)', cursor: 'pointer', fontSize: 13,
                }}>
                  <span style={{ fontWeight: 600 }}>{s.title}</span>
                  {s.description && <span style={{ color: 'var(--text-muted)' }}> — {s.description}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {(['ALL', ...STATUS_ORDER] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: filter === s ? 'var(--brand-light)' : 'var(--text-muted)',
            borderBottom: filter === s ? '2px solid var(--brand)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {s === 'ALL' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p style={{ color: 'var(--text-muted)' }}>No tasks here yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTasks.map(task => (
            <div key={task.id} style={taskCard}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{task.title}</span>
                  <select value={task.status} onChange={e => handleStatusChange(task, e.target.value as TaskStatus)}
                    style={selectStyle}>
                    {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                {task.description && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{task.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setEditTask(task)} style={iconBtn}>✏️</button>
                <button onClick={() => handleDeleteTask(task.id)} style={{ ...iconBtn, color: '#fca5a5' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskForm && (
        <div style={overlay}>
          <div style={modal} className="animate-fade-in">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>New Task</h2>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input required value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Task title" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value as TaskStatus }))}
                  style={inputStyle}>
                  {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowTaskForm(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" disabled={submitting} style={btnPrimary}>{submitting ? 'Adding...' : 'Add Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editTask && (
        <div style={overlay}>
          <div style={modal} className="animate-fade-in">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Edit Task</h2>
            <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input required value={editTask.title} onChange={e => setEditTask(t => t ? { ...t, title: e.target.value } : t)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={editTask.description ?? ''} onChange={e => setEditTask(t => t ? { ...t, description: e.target.value } : t)}
                  rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={editTask.status} onChange={e => setEditTask(t => t ? { ...t, status: e.target.value as TaskStatus } : t)}
                  style={inputStyle}>
                  {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditTask(null)} style={btnSecondary}>Cancel</button>
                <button type="submit" disabled={submitting} style={btnPrimary}>{submitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editProject && (
        <div style={overlay}>
          <div style={modal} className="animate-fade-in">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Edit Project</h2>
            <form onSubmit={handleUpdateProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input required value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditProject(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" style={btnPrimary}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = { background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 18px', fontSize: 14, cursor: 'pointer' }
const btnAi: React.CSSProperties = { background: 'rgba(99,102,241,0.15)', color: 'var(--brand-light)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const taskCard: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }
const badgeStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: '4px', borderRadius: 4, color: 'var(--text-muted)' }
const selectStyle: React.CSSProperties = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 11, fontWeight: 600, padding: '2px 6px', cursor: 'pointer', outline: 'none' }
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }
const modal: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }
