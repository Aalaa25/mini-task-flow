// src/app/auth/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'radial-gradient(ellipse at 60% 0%, #1e1b4b 0%, #0f1117 60%)' }}>
      {children}
    </div>
  )
}
