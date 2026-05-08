# ⚡ TaskFlow — Mini Task Manager

A full-stack task management app built with **Next.js 14**, **PostgreSQL**, **Prisma**, and **Anthropic Claude AI**.

---

## 🚀 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | Next.js 14 (App Router)             |
| Database   | PostgreSQL + Prisma ORM             |
| Auth       | JWT (httpOnly cookies) + bcrypt     |
| AI         | Anthropic Claude API (Sonnet)       |
| Styling    | Tailwind CSS + CSS Variables        |
| Validation | Zod                                 |
| Language   | TypeScript                          |

---

## ✅ Features

- **User Management** — Register/Login with JWT auth & bcrypt password hashing
- **Authorization** — Full data isolation (users only see their own data)
- **Project CRUD** — Create, Read, Update, Delete projects
- **Task CRUD** — Create, Read, Update, Delete tasks within projects
- **Task Status** — Move tasks through: `To Do → In Progress → Done`
- **Dashboard** — Lists projects with task counters per status
- **AI Summarize** — Claude generates a smart project progress summary
- **AI Suggest** — Claude suggests 5 relevant tasks for your project
- **Responsive UI** — Mobile-friendly dark theme

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js 18+ (`node --version`)
- PostgreSQL running locally (or use a cloud DB like Neon/Supabase)
- An Anthropic API key from https://console.anthropic.com

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
```
Edit `.env.local` and fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — any long random string
- `ANTHROPIC_API_KEY` — your Anthropic key

**Quick PostgreSQL setup (local):**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE taskmanager;"

# Then set DATABASE_URL in .env.local:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskmanager"
```

### 4. Initialize the database
```bash
npm run db:push      # Creates all tables
npm run db:generate  # Generates Prisma client
```

### 5. Run the app
```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to the login page.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts    # POST /api/auth/register
│   │   │   ├── login/route.ts       # POST /api/auth/login
│   │   │   ├── logout/route.ts      # POST /api/auth/logout
│   │   │   └── me/route.ts          # GET  /api/auth/me
│   │   ├── projects/
│   │   │   ├── route.ts             # GET, POST /api/projects
│   │   │   └── [id]/
│   │   │       ├── route.ts         # GET, PUT, DELETE /api/projects/:id
│   │   │       └── tasks/route.ts   # GET, POST /api/projects/:id/tasks
│   │   ├── tasks/
│   │   │   └── [taskId]/route.ts    # GET, PUT, DELETE /api/tasks/:taskId
│   │   └── ai/
│   │       ├── summarize/route.ts   # POST /api/ai/summarize
│   │       └── suggest/route.ts     # POST /api/ai/suggest
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx                 # Projects dashboard
│   │   └── projects/[id]/page.tsx   # Project detail + tasks
│   └── globals.css
├── components/
│   └── layout/Navbar.tsx
├── lib/
│   ├── auth.ts                      # JWT + bcrypt utilities
│   ├── db.ts                        # Prisma singleton
│   ├── api.ts                       # Response helpers
│   └── validations.ts               # Zod schemas
├── middleware.ts                    # Route protection
└── prisma/
    └── schema.prisma                # Database schema
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET  | `/api/auth/me` | Current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project + tasks |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/tasks` | List tasks (filterable by status) |
| POST | `/api/projects/:id/tasks` | Create task |
| GET | `/api/tasks/:taskId` | Get single task |
| PUT | `/api/tasks/:taskId` | Update task |
| DELETE | `/api/tasks/:taskId` | Delete task |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/summarize` | Generate project summary |
| POST | `/api/ai/suggest` | Get 5 AI-suggested tasks |

---

## 🏗️ Build for Production

```bash
npm run build
npm start
```

---

## 💡 Key Design Decisions

- **Next.js App Router** — Co-locates API routes and pages, reducing complexity
- **Prisma** — Type-safe DB access, easy migrations
- **httpOnly JWT cookies** — Secure, no localStorage token exposure
- **Zod validation** — Server-side validation on every API endpoint
- **Data isolation** — Every DB query filters by `userId` — users can never access other users' data
- **Anthropic Claude** — Used for smart project summaries and AI task suggestions
