# SLPL Web - Claude Code Instructions

## Project Overview

**Sri Lanka Padel League (SLPL) 2026 Admin Dashboard** — a Next.js web application for managing teams, players, groups, matches, and league data. This is the control panel that drives the mobile app. Near launch.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| UI Components | Chakra UI v3 |
| Styling | Tailwind CSS v4 |
| Database/Backend | Supabase (PostgreSQL + Storage) |
| Forms | React Hook Form v7 |
| Language | TypeScript (strict) |
| Animations | Framer Motion |
| Icons | React Icons (Material Design `md` prefix) |

## Project Structure

```
slplweb/
├── app/
│   ├── api/               # Server-side API routes (Supabase queries live here)
│   │   ├── groups/
│   │   ├── league/
│   │   ├── matches/
│   │   ├── players/
│   │   ├── teams/[id]/
│   │   └── upload/        # Supabase Storage image upload
│   ├── groups/            # Groups admin page
│   ├── leader-board/      # Leaderboard (stub)
│   ├── league/            # League info (stub)
│   ├── matches/           # Match fixtures (mock data, not wired yet)
│   ├── players/           # Players CRUD page
│   ├── teams/             # Teams CRUD page + [id] detail page
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Dashboard home
├── components/
│   ├── AppShell.tsx       # Sidebar nav shell
│   └── ui/                # Chakra UI primitives (color-mode, provider, toaster)
└── utils/
    ├── lib/supabase.ts    # Supabase client
    └── types/             # TypeScript types: group.ts, player.ts, team.ts
```

## Architecture Patterns

### Client vs Server Split
- **All API routes** (`app/api/**`) run server-side and own all Supabase queries
- **All page and component files** are `"use client"` — they fetch data by calling the API routes
- Data flow: Client component → `fetch("/api/...")` → API route → Supabase → JSON response

### Supabase Usage
- Client initialized in `utils/lib/supabase.ts` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_KEY`
- Standard CRUD pattern across all API routes:
  ```ts
  // GET
  supabase.from("slpl_teams").select("*, slpl_groups(*)").order("created_at", { ascending: false })
  // POST
  supabase.from("slpl_teams").insert([body]).select().single()
  // PUT
  supabase.from("slpl_teams").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id)
  // DELETE (hard)
  supabase.from("slpl_teams").delete().eq("id", id)
  // DELETE (soft — players use this)
  supabase.from("slpl_players").update({ deleted_at: new Date().toISOString() }).eq("id", id)
  ```
- Soft deletes for players: always filter with `.is("deleted_at", null)` on reads
- Nested join results are flattened in API routes before returning to client

### Database Tables

| Table | Purpose |
|-------|---------|
| `slpl_teams` | Team info: name, color, logo, social links, group_id |
| `slpl_players` | Player base: first_name, last_name, deleted_at |
| `slpl_player_profiles` | Extended profile: photo, nationality, best_hand, court_side |
| `slpl_team_players` | M2M: teams ↔ players |
| `slpl_team_managers` | Team manager info |
| `slpl_groups` | League groups/divisions |

Storage bucket: `slpl` — used for team logos and player photos.

### File Upload Pattern
- Route: `app/api/upload/route.ts`
- Uploads to Supabase Storage with `timestamp + random hash` filename
- Returns public URL — store this URL in the relevant table column

## Coding Conventions

### Components
- Use Chakra UI components first; Tailwind for layout/spacing overrides only
- Icons: always use Material Design icons (`import { MdXxx } from "react-icons/md"`)
- Modals managed with `useState` (open/close) + React Hook Form for form state
- Reset form on modal close

### TypeScript
- Types live in `utils/types/` — keep them there, don't inline types in components
- The `@/*` path alias maps to the project root

### State & Data Fetching
- Client components fetch on mount via `useEffect` + `fetch`
- Use `isMounted` flag in effects that set state to prevent memory leaks
- Loading states: Chakra `Spinner` for page loads, `loading` prop on `Button` for async actions

### Error Handling
- API routes: return `NextResponse.json({ error: "..." }, { status: 4xx/5xx })`
- Client components: `try/catch` with fallback to empty state
- Always check `Array.isArray(data)` before rendering lists

### Design System
- Primary accent: `orange.500`
- Card border radius: `2xl`
- Card shadow: `sm` default, `lg` on hover
- Background: `#f8fafc` (light slate)
- Font: Outfit (loaded via `layout.tsx`)

## Current Feature Status

| Feature | Status |
|---------|--------|
| Teams CRUD | Done |
| Players CRUD | Done |
| Groups CRUD | Done |
| Dashboard home | Done |
| File upload | Done |
| Dark mode | Done |
| Matches | Mock data only — needs Supabase wiring |
| Leaderboard | Stub — not started |
| League info | Stub — not started |
| Auth | Not yet built |

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_KEY=...
```

Both are public/publishable keys. Never use service role keys in client-accessible code.

## Development

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # ESLint
```
