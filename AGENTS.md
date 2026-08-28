<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Applywise

A local-first job application tracker for a single, non-technical user. A Kanban board
(Wishlist → Applied → Interviewing → Offer → Rejected) of draggable job cards; clicking a card
generates an AI "application kit" (cover letter, resume bullets, 5 interview questions, company
brief) via **OpenRouter**. A **Find Jobs** page (`/discover`) searches live openings (The Muse) and
sends results straight to the Wishlist. Runs locally on SQLite; built to deploy later by swapping the
Prisma datasource to Postgres without app-code changes. An optional single-password lock gates the
whole app when hosted.

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build (runs tsc + lint too — use this to validate changes)
npm run lint     # eslint only
npx tsc --noEmit # type-check only

npx prisma migrate dev --name <name>   # change schema → new migration + regenerate client
npx prisma studio                      # inspect/edit the local dev.db
```

No test suite. Validate with `npm run build` and by exercising the running app.

### Environment gotchas (the Windows machine this was built on)
- **Node** is at `C:\Program Files\nodejs`; it was installed mid-project, so fresh shells may have a
  stale PATH and fail to find `node`/`npm`. Reopen the terminal, or prefix commands with:
  `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`
- **Prisma is pinned to v6 on purpose — do not upgrade to v7.** v7 drops `url = env(...)` from schema
  datasources and needs a native driver adapter (risky build on Node 24). v6 uses the bundled SQLite
  engine.
- `.claude/launch.json` (preview server) invokes node by absolute path because the preview spawn has
  no node on PATH. `Open Applywise.bat` (double-click launcher) is gitignored — it has a machine path.

### Environment variables (`.env`; see `.env.example`)
- `DATABASE_URL` — SQLite file locally (`file:./dev.db`); swap to a Postgres URL on deploy.
- `APP_PASSWORD` — **optional.** When set, `src/proxy.ts` locks the whole app behind it; when unset,
  the app is open (the default locally). The OpenRouter key is **not** here — it lives in the
  `Settings` DB row.

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma + SQLite ·
@dnd-kit · OpenRouter.

### Data model (`prisma/schema.prisma`)
- `Profile` and `Settings` are **single-row tables** keyed by `id = "singleton"`. Always read them
  via `getProfile()` / `getSettings()` in `src/lib/db.ts` (they upsert-on-read). `prisma` is a
  hot-reload-safe singleton exported from the same file.
- `Job.status` is a **string, not a DB enum** (SQLite has none). Allowed values + per-column
  presentation live in `src/lib/status.ts` (`STATUSES`, `COLUMNS`, `isStatus`) — use those, never
  hard-code status strings. `Job.order` is a float for within-column ordering. `Kit` is one-per-job.

### AI layer — server-only
- `src/lib/openrouter.ts` (`chat()`) is the only OpenRouter caller. The key is read from the
  `Settings` row **server-side** and must never reach the browser — `/api/settings` returns only
  `hasApiKey`, never the key.
- `src/lib/prompts.ts` holds the four kit prompts (shared system prompt grounds output strictly in
  the resume + job text). `POST /api/jobs/[id]/kit` runs all four in parallel and upserts the `Kit`.
- **Output is plain text — no markdown, no "AI-generated" disclaimers.** The prompts forbid markdown,
  and `src/lib/clean-text.ts` (`cleanText`) strips any stray `#`/`**`/bullets server-side before
  saving. Keep both in sync; don't reintroduce disclaimer copy in the prompts or the kit UI.

### API routes (`src/app/api/**/route.ts`)
Thin handlers over Prisma. In Next 16 `params` is a Promise — `await params`. Node-only parsers
(`jsdom`, `unpdf`, `mammoth`) run in handlers and are in `serverExternalPackages` (`next.config.ts`)
so the bundler leaves them alone.
- `POST /api/jobs/[id]/move` — drag persistence: `{ status, orderedIds }` rewrites `order = index`
  for the whole destination column in one transaction (client sends the full ordered id list).
- `POST /api/fetch-url` — jsdom + @mozilla/readability; returns `partial: true` (HTTP 200) on failure
  instead of erroring, since many job sites block scraping and the UI falls back to manual paste.
- `POST /api/profile/upload` — multipart PDF/DOCX → text via unpdf / mammoth.
- `POST /api/discover` — job search. Body `{ role, location, type }`; returns normalized results.
  Soft-fails with `{ error }` at HTTP 200 so the UI shows a friendly message (e.g. rate limits).
- `POST /api/unlock` — verifies `APP_PASSWORD` and sets the auth cookie (see Password lock).

### Find Jobs (`src/app/discover/page.tsx`, `src/lib/the-muse.ts`)
- `searchJobs()` queries **The Muse public API (no key)**. Always biased to undergrad-friendly
  levels: it requests only `Internship` + `Entry Level` — the Research/Internship/Full-time toggle
  just refines within that (never request senior/mid). The Muse has no free-text query, so it fetches
  a few pages by level/location and filters by role keyword against the title; HTML is stripped to
  plain text. "Wishlist" buttons POST to `/api/jobs`. Last search persists in `localStorage`.

### Password lock (`src/proxy.ts`, `src/lib/auth.ts`, `/unlock`)
- Next 16 renamed the `middleware` convention to **`proxy`** — the file is `src/proxy.ts` exporting a
  `proxy` function (do not recreate `middleware.ts`). It's a no-op unless `APP_PASSWORD` is set.
- `authToken()` (Web Crypto SHA-256, edge-safe) derives the cookie value shared by the proxy and the
  `/api/unlock` route. `/unlock` is the on-brand password page; `TopNav`/`SiteFooter` hide there.

### Board UI (`src/components/board/`)
- `board.tsx` is the client-side source of truth: groups jobs into `Record<Status, JobWithKit[]>`
  and owns all @dnd-kit logic. Cross-column dragging uses the multi-container pattern (`onDragOver`
  moves the card live between columns, `onDragEnd` finalizes + persists). **`<DndContext>` must keep
  a stable `id`** or dnd-kit's `aria-describedby` ids cause an SSR hydration mismatch.
- Dialogs report back via `onCreated` / `onUpdated` / `onDeleted` to keep board state in sync without
  a refetch. The board page (`src/app/page.tsx`) is `force-dynamic` and seeds jobs from Prisma.

### Design system
`DESIGN.md` is the source of truth: a Linear-inspired **dark-only** theme. Tokens are encoded as CSS
vars + Tailwind theme in `src/app/globals.css`; UI primitives in `src/components/ui/` are hand-rolled
to match (no shadcn CLI). Rules: lavender `--primary` is used scarcely (CTA, focus, brand mark, links
— never a fill); depth comes from the surface ladder + hairline borders, never shadows; buttons/
inputs 8px radius, cards 12px, panels 16px — CTAs are never pill-rounded.
