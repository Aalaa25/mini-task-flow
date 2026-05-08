'use client'
// src/app/dashboard/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  taskCount: number
  tasksByStatus: { TODO: number; IN_PROGRESS: number; DONE: number }
}

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchProjects = async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    if (res.ok) setProjects(data.data.projects)
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setForm({ name: '', description: '' })
    setShowForm(false)
    await fetchProjects()
    setSubmitting(false)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this project and all its tasks?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    await fetchProjects()
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 80 }}>Loading projects...</div>

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>My Projects</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={btnPrimary}>
          + New Project
        </button>
      </div>

      {/* Create Project Modal */}
      {showForm && (
        <div style={overlay}>
          <div style={modal} className="animate-fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>New Project</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div style={errorBox}>{error}</div>}
              <div>
                <label style={labelStyle}>Project Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Website Redesign" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What's this project about?" rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => { setShowForm(false); setError('') }} style={btnSecondary}>Cancel</button>
                <button type="submit" disabled={submitting} style={btnPrimary}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>No projects yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Create your first project to get started</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projects.map(project => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}
              style={{ textDecoration: 'none' }}>
              <div style={cardStyle} onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
                   onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{project.name}</h3>
                  <button onClick={e => handleDelete(project.id, e)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}>✕</button>
                </div>
                {project.description && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {project.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <span className="badge-todo" style={badgeStyle}>{project.tasksByStatus.TODO} To Do</span>
                  <span className="badge-inprogress" style={badgeStyle}>{project.tasksByStatus.IN_PROGRESS} In Progress</span>
                  <span className="badge-done" style={badgeStyle}>{project.tasksByStatus.DONE} Done</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  background: 'transparent', color: 'var(--text-muted)',
  border: '1px solid var(--border)', borderRadius: 8,
  padding: '9px 18px', fontSize: 14, cursor: 'pointer',
}
const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
  padding: 20, display: 'flex', flexDirection: 'column', minHeight: 140,
  transition: 'border-color 0.2s, transform 0.1s', cursor: 'pointer',
}
const badgeStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
}
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  backdropFilter: 'blur(4px)',
}
const modal: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
  padding: 28, width: '100%', maxWidth: 460,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }
const errorBox: React.CSSProperties = { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: 13 }
