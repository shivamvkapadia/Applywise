# Applywise — your job application tracker

A private, local web app to track your job hunt on a pipeline board and generate
tailored application kits (cover letter, resume bullets, likely interview
questions, and a company brief) using AI via OpenRouter.

Everything runs **on your own computer**. Your data lives in a local file
(`dev.db`); your OpenRouter API key is stored locally and never leaves your machine
except to call OpenRouter.

---

## Starting the app

1. Open a terminal in this folder.
2. Run:

   ```bash
   npm run dev
   ```

3. Open **http://localhost:3000** in your browser.

To stop it, press `Ctrl + C` in the terminal.

> First time on a fresh machine? Make sure Node.js is installed (https://nodejs.org),
> then run `npm install` once before `npm run dev`.

---

## First-time setup (2 minutes)

1. **Settings** → paste your **OpenRouter API key** (get one at
   https://openrouter.ai/keys). Click **Test connection** to confirm it works.
   The default model is **Claude Sonnet** — change it anytime.
2. **Profile** → **Upload** your resume (PDF or DOCX). The text is extracted into
   an editable box; tidy it up and **Save**.

---

## Using it

- **Add a job** (top-right on the board): paste a job **link** and click *Fetch* to
  auto-fill the details, or just type them in. New jobs land in **Wishlist**.
- **Drag cards** between columns: Wishlist → Applied → Interviewing → Offer → Rejected.
- **Click a card** to open it. Edit the description/notes, then click
  **Generate kit** to get your four AI documents. **Copy** or **Download** each one,
  or **Regenerate** to try again. Generated kits are saved with the job.

A small **Kit ready** badge appears on cards that already have a generated kit.

---

## Notes

- Some job sites block automated fetching — when that happens, just paste the job
  description into the box manually.

## Tech

Next.js (App Router) · TypeScript · Tailwind CSS · Prisma + SQLite · @dnd-kit ·
OpenRouter. The visual design follows `DESIGN.md` (a Linear-inspired dark theme).
Built to run locally now and deploy later (swap SQLite for Postgres in
`prisma/schema.prisma`).
