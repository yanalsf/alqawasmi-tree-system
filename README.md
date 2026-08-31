# Family Tree — Next.js / Tailwind rebuild

Two independent apps sharing one data file:

```
apps/public   → deployed to Netlify. Static export. No DB access, no secrets.
apps/admin    → runs only on your machine (npm run dev). Talks to MySQL.
```

They're connected by one file: `apps/public/data/tree.json`. The admin app
writes it after every edit and pushes it to git; Netlify's normal git-based
auto-deploy picks it up from there. See `apps/admin/lib/sync.ts`.

## How the migration was done

`index.html` and `editing.html` were not rewritten line-by-line into Tailwind
JSX. Given how much hand-written CSS and DOM-manipulation logic they contain
(~2,600 and ~2,700 lines), a manual translation can't be verified pixel-for-
pixel without someone clicking through every screen of both apps side by side
— any small slip becomes a silent visual or functional regression.

Instead, each page's original markup, CSS, and inline `<script>` content were
extracted verbatim and are:

1. Loaded as an unmodified stylesheet (`app/legacy.css` in each app).
2. Injected into the DOM as-is (`dangerouslySetInnerHTML`).
3. Executed as real classic `<script>` tags, in original order, once mounted
   (`LegacyTreeApp.tsx` / `LegacyAdminApp.tsx`).

This means the shipped behavior **is** your original code, running inside a
Next.js shell — not a reinterpretation of it. Tailwind is installed in both
apps (with `preflight` disabled so it can't override the legacy styles) and
is ready to use for any new components you build going forward; see
`tailwind.config.js` in each app.

The one intentional behavioral change: `apps/admin/app/LegacyAdminApp.tsx`
converts the original `document.addEventListener('DOMContentLoaded', ...)`
block into an immediately-invoked function, because by the time our
component mounts, the browser's `DOMContentLoaded` event has already fired
once and would never call that listener — that block ran the image-modal
popup, so this fix was required for it to keep working at all.

## Database

The API is built against your **live** `person` table (confirmed from your
MySQL client): `person_id, name_text, parent_id, birth_date, death_date,
created_at, updated_at, branch_id`. Branch roots (داوود, ابو نواره, ...) store
`parent_id = 941` — a sentinel id that is never itself a row, inherited from
the old data.js `System_Root` node. `apps/admin/db/schema.sql` documents this
structure for reference / fresh environments — **you don't need to run it**,
since your database already exists and is populated.

`apps/admin/scripts/seed-from-json.mjs` is only for disaster recovery
(rebuilding `person` from a `tree.json` backup) — not needed for your normal
setup either.

## First-time setup

```bash
# from the repo root
npm install -g pnpm      # if you don't have it
pnpm install

cp apps/admin/.env.local.example apps/admin/.env.local
# edit apps/admin/.env.local with your real DB_HOST/DB_USER/DB_PASSWORD/DB_NAME,
# EDITOR_PASSWORD, and SITE_REPO_PATH (absolute path to this checkout)
```

## Running

```bash
# admin (local only — never deploy this)
pnpm admin:dev
# open http://localhost:3000

# public site (what gets deployed)
pnpm public:dev
# open http://localhost:3001 (or whatever port Next picks)
```

## Deploying the public site to Netlify

- Connect this repo to Netlify.
- Base directory: `apps/public`
- Build command: `npm run build` (or `next build`)
- Publish directory: `apps/public/out`
- Every time the admin app syncs, it commits `apps/public/data/tree.json` and
  pushes to `main` — Netlify's normal git-based auto-deploy takes it from
  there. No Netlify environment variables or secrets are needed, since this
  app never talks to the database.

## Security note

Your original `_env` file was shared in the chat that produced this project,
with real credentials in plaintext (`DB_PASSWORD`, `EDITOR_PASSWORD` — both
the same value). Treat both as compromised:

- Rotate your MySQL user's password.
- Pick a **different**, new `EDITOR_PASSWORD` and put it only in
  `apps/admin/.env.local` (gitignored, never committed).
