'use client'
// src/components/layout/Navbar.tsx
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  user: { name: string; email: string }
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav style={{
      background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', height: 60, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'blur(12px)',
    }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <div style={{ width: 30, height: 30, background: 'var(--brand)', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>TaskFlow</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--brand)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {user.name[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{user.name}</span>
        </div>
        <button onClick={logout} style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#fca5a5', padding: '6px 14px', borderRadius: 8, fontSize: 13,
          cursor: 'pointer', fontWeight: 500,
        }}>
          Logout
        </button>
      </div>
    </nav>
  )
}
