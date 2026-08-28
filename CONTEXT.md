# Applywise — project context

Orientation for anyone (or anything) picking this codebase up cold. This is the
"why and how it fits together" document.

| Doc | Covers |
| --- | --- |
| `README.md` | How to run and use the app (written for the end user) |
| `AGENTS.md` | Working rules, commands, environment gotchas, invariants |
| `DESIGN.md` | The visual system — the source of truth for all UI decisions |
| **`CONTEXT.md`** | **What this is, why it's shaped this way, and how it connects** |

---

## What it is

Applywise is a **local-first job application tracker with an AI assist layer**. It
does two things:

1. **Tracks the pipeline.** A Kanban board of draggable job cards moving through
   five fixed columns: Wishlist → Applied → Interviewing → Offer → Rejected.
2. **Generates an application kit.** For any job, one click produces four
   documents grounded in your resume and that job's description — a cover letter,
   rewritten resume bullets, five likely interview questions with tips, and a
   company brief.

A third page, **Find Jobs** (`/discover`), searches live openings and drops them
straight into the Wishlist, so the board can be filled without leaving the app.

## Who it's for

A **single, non-technical user** running it on their own machine. That single
assumption drives most of the architecture:

- No accounts, no user table, no multi-tenancy. `Profile` and `Settings` are
  literally one-row tables keyed `id = "singleton"`.
- No login by default. An **optional** single password (`APP_PASSWORD`) locks the
  whole app, and exists only for the case where it gets hosted somewhere public.
- Errors are phrased as plain-English guidance ("Add your OpenRouter API key in
  Settings first"), not status codes.
- Failure modes degrade into manual paths rather than dead-ending — see
  *Soft-fail* below.

## Privacy model

This is the load-bearing constraint, not a feature bullet.

- Data lives in a local SQLite file (`dev.db`), which is gitignored.
- The **OpenRouter API key is stored in the database, not in `.env`**, and is read
  server-side only. `/api/settings` returns `{ hasApiKey, model }` — never the key
  itself. `src/lib/openrouter.ts` is the only module that touches it.
- Nothing leaves the machine except the OpenRouter calls themselves.

If you add a route, a client component, or a log line that could expose that key,
you've broken the central promise of the app.

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma + SQLite ·
@dnd-kit · OpenRouter.

Two version notes that will bite you if you assume defaults:

- **Next 16 renamed the `middleware` convention to `proxy`.** The file is
  `src/proxy.ts` exporting a `proxy` function. Do not recreate `middleware.ts`.
  Also, route `params` is now a `Promise` — `await params`.
- **Prisma is pinned to v6 deliberately.** v7 drops `url = env(...)` from schema
  datasources and requires a native driver adapter. v6 uses the bundled SQLite
  engine and works. Don't upgrade it casually.

## Data model

Four tables in `prisma/schema.prisma`:

- **`Profile`** — singleton. Resume text (extracted from an uploaded PDF/DOCX and
  then hand-editable), name, contact details.
- **`Settings`** — singleton. OpenRouter key + model. Default model is
  `anthropic/claude-sonnet-4.5`.
- **`Job`** — one board card. `status` is a **plain string, not a DB enum**,
  because SQLite has no enums; the allowed values and their per-column
  presentation live in `src/lib/status.ts` (`STATUSES`, `COLUMNS`, `isStatus`).
  Never hard-code a status string anywhere else. `order` is a float used for
  within-column ordering.
- **`Kit`** — the four generated documents, one per job, upserted in place on
  regenerate. Cascades on job delete.

Both singletons are read through `getProfile()` / `getSettings()` in
`src/lib/db.ts`, which **upsert on read** — so first access on a fresh database
creates the row rather than returning null. The same file exports the
hot-reload-safe `prisma` client singleton.

## How a request flows

**Adding a job.** Paste a URL → `POST /api/fetch-url` runs jsdom +
`@mozilla/readability` server-side to pull title/company/description → the dialog
pre-fills → `POST /api/jobs` saves it into Wishlist.

**Dragging a card.** `board.tsx` is the client-side source of truth: it holds jobs
grouped as `Record<Status, JobWithKit[]>` and owns all @dnd-kit logic. Cross-column
drags use the multi-container pattern — `onDragOver` moves the card live between
columns, `onDragEnd` finalizes and persists. Persistence is
`PATCH /api/jobs/[id]/move` with `{ status, orderedIds }`, where the client sends
the **entire ordered id list** for the destination column and the server rewrites
`order = index` for all of them in one transaction. This avoids fractional-index
drift at the cost of a slightly chattier payload.

**Generating a kit.** `POST /api/jobs/[id]/kit` loads the job, profile, and
settings, builds a shared `KitContext`, and fires **all four prompts in parallel**
via `Promise.all`. Each result passes through `cleanText()` before being upserted
into `Kit`. Runs on the Node runtime with `maxDuration = 120`.

**The password lock.** When `APP_PASSWORD` is unset the proxy is a no-op. When
set, every path except `/unlock` and `/api/unlock` requires a cookie whose value
is `authToken(password)` — a SHA-256 hash via Web Crypto, chosen because it has to
run in both the edge proxy and a Node route handler.

## The AI layer

`src/lib/prompts.ts` holds all four prompts behind a shared system prompt whose
job is to keep output **grounded** — never invent employers, titles, dates,
degrees, or metrics the resume doesn't support.

The other rule that system prompt enforces: **plain text, no markdown, no
disclaimers.** Users copy this text straight into an application, where stray `##`
and `**` are noise and an "as an AI" preamble is actively harmful. This is
defended twice — the prompts forbid markdown, and `src/lib/clean-text.ts` strips
headings, bold, code ticks, links, blockquotes, and rules server-side before
anything is saved. **Keep both halves in sync**, and don't reintroduce disclaimer
copy in the prompts or the kit UI.

## Find Jobs

`src/lib/the-muse.ts` queries **The Muse's public API**, which needs no key — that
was the whole reason for choosing it. Two consequences shape the code:

- The API has **no free-text search**, so `searchJobs()` fetches a few pages
  filtered by level and location, then keyword-matches the role against job titles
  and categories client-of-the-API-side. Pages are fetched with `allSettled` so a
  rate-limited page doesn't sink the whole search, and a location filter that
  returns nothing is retried once without it.
- Results are **always biased to undergrad-friendly levels** — it requests only
  `Internship` and `Entry Level`, and the Research/Internship/Full-time toggle only
  refines *within* that set. Never widen this to senior or mid roles.

HTML in listings is stripped to plain text and capped at 6000 chars. The last
search persists in `localStorage`.

## Soft-fail as a convention

Two routes deliberately return **HTTP 200 with a flag** instead of an error status:

- `POST /api/fetch-url` returns `partial: true` when scraping fails — many job
  sites block automated fetching, and the intended recovery is "paste the
  description in manually," not an error toast.
- `POST /api/discover` returns `{ error }` at 200 so rate limits surface as a
  friendly message.

If you add an integration with a third party that can plausibly refuse, follow
this pattern rather than throwing a 5xx at a non-technical user.

## Design

`DESIGN.md` governs, and it is **dark-only by design** — there is no light theme
and adding one is not a small change. Tokens are encoded as CSS variables plus a
Tailwind theme in `src/app/globals.css`; UI primitives in `src/components/ui/` are
hand-rolled to match rather than pulled from shadcn.

Three rules that get violated most often:

- **Lavender (`--primary`, `#5e6ad2`) is scarce** — CTA, focus ring, brand mark,
  link emphasis. Never a fill, never a background wash.
- **Depth comes from the surface ladder + hairline borders, never drop shadows.**
  The ladder runs `--canvas` `#010102` → `--surface-4` `#27282c`.
- **Radius is fixed by role:** buttons and inputs 8px, cards 12px, panels 16px.
  CTAs are never pill-rounded.

Green (`--success`) is the only sanctioned semantic color. Status dots are an
exception carved out for 8px column markers only.

---

## Repository map

```
prisma/schema.prisma          data model + migrations
src/app/
  page.tsx                    the board (force-dynamic, seeds jobs from Prisma)
  discover/                   Find Jobs
  profile/  settings/         resume + API key
  unlock/                     password page (nav/footer hidden here)
  api/**/route.ts             thin handlers over Prisma
  globals.css                 design tokens
src/components/
  board/                      board, column, job-card, dialogs, kit-panel
  ui/                         hand-rolled primitives
src/lib/
  db.ts                       prisma singleton + singleton-row readers
  status.ts                   allowed statuses + column presentation
  openrouter.ts               the only OpenRouter caller
  prompts.ts  clean-text.ts   the AI layer
  the-muse.ts                 job search
  auth.ts                     password token derivation
src/proxy.ts                  optional whole-app lock (Next 16 "proxy")
```

Node-only parsers (`jsdom`, `unpdf`, `mammoth`) run inside route handlers and are
listed in `serverExternalPackages` in `next.config.ts` so the bundler leaves them
alone.

## Working on it

```bash
npm run dev        # http://localhost:3000
npm run build      # type-checks and lints too — this is the validation gate
npx prisma studio  # inspect the local dev.db
```

**There is no test suite.** Validation is `npm run build` plus actually exercising
the running app. Factor that into how you review changes.

## Deployment posture

Built to run locally now and deploy later without app-code changes: swap the
Prisma datasource from `sqlite` to `postgresql` and point `DATABASE_URL` at a
hosted database. The two things to remember on a deploy are that `APP_PASSWORD`
should be set (the lock is off by default) and that the OpenRouter key travels in
the database, not the environment — so it must be re-entered in Settings on the
deployed instance.

## Known gaps

- No tests, no CI.
- One resume for all jobs; no per-application variants.
- Kits are all-or-nothing — no way to regenerate a single document.
- Job search is limited to The Muse's catalog and its level filters.
- `Job.order` is rewritten wholesale per column on every move; fine at personal
  scale, not something to carry into a multi-user version.
