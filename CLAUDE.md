# CookBook+ (midterm-project-byrondray)

A Next.js 14 (App Router) recipe-sharing app. Users sign in with GitHub, create/edit/delete recipes with images, and browse/search everyone else's recipes.

## Design sense — read this first

This is a visually-driven app (branded "Recipe Hub" in the navbar, "CookBook+" as the page-title suffix). **Any UI work should be held to a high design bar, not just a functional one.** Concretely:

- **Never use native browser dialogs** (`window.confirm`, `window.alert`, `window.prompt`) for anything user-facing. Build a proper modal/toast component that matches the app's visual language. See [src/app/components/deleteConfirmModal.tsx](src/app/components/deleteConfirmModal.tsx) for the pattern: portal-rendered, focus-trapped, Escape-to-close, backdrop-click-to-close, animated in/out.
- **Match the existing visual system** before inventing a new one:
  - Palette: orange-to-red gradients (`from-orange-500 to-red-500`, `from-orange-400 to-red-500`) for primary actions and hero sections; `from-orange-50 to-red-50` for page backgrounds.
  - Shape language: pill buttons (`rounded-full`) for actions, `rounded-2xl` cards/modals/panels, soft large shadows (`shadow-lg`/`shadow-xl`/`shadow-2xl`) that intensify on hover.
  - Motion: subtle `hover:scale-105` on cards/buttons, `transition-all duration-200`, fade/slide-in keyframes defined per-page in `<style jsx>` blocks (`fade-in-down`, `fade-in-up`, `menu-slide-down`, `scale-in`).
  - Icons: `react-icons/fa` (e.g. `FaTrashAlt`) and inline Heroicons-style SVGs — stay consistent with whichever a given area already uses rather than mixing icon sets.
- **Apply real design heuristics, not just Tailwind classes**: sufficient contrast, obvious affordances (buttons look clickable, disabled states look disabled), clear visual hierarchy (one primary action per view), forgiving interactions (confirm before destructive actions, easy undo/cancel), and feedback for every async action (spinners, disabled+loading button states — this app already does this consistently, follow the pattern in `createRecipe/page.tsx` and `editRecipe/[id]/page.tsx`).
- **Accessibility is part of design, not separate from it**: modals need `role`, `aria-*`, focus trapping and restoration, and Escape handling (see `deleteConfirmModal.tsx`); interactive elements need visible focus states; images need meaningful `alt` text.
- Every page already implements its own loading skeleton (`src/app/components/skeletons.tsx`) and error state — new pages should do the same rather than a bare spinner or blank screen. Skeletons must preserve the page's actual background gradient behind the pulsing placeholders (see `HomePageSkeleton`, etc.) instead of a flat gray screen.
- Every client page sets its own document title via `usePageTitle` (`"<Page> | CookBook+"`) — see [src/app/components/usePageTitle.ts](src/app/components/usePageTitle.ts). New pages should call this too.

When in doubt, open the closest existing page/component and mirror its structure, spacing scale, and animation style rather than improvising a new pattern.

## Stack

- **Next.js 14.2 (App Router)**, React 18, TypeScript
- **Styling**: Tailwind CSS + a small shadcn/ui-derived component set in `src/components/ui/` (Button, Input, Label, ScrollArea, Spinner, Form). No dialog/toast primitive is installed yet — custom modals are hand-built (portal + Tailwind), see `deleteConfirmModal.tsx`.
- **Auth**: NextAuth v5 (beta) with the GitHub provider only, Drizzle adapter. Config is split in `src/auth.ts`: `authConfig` (Edge-safe, used in middleware) vs `fullAuthConfig` (adds the DB adapter, used everywhere else). Protected path prefixes live in `authConfig.callbacks.authorized` (currently `/editRecipe`, `/createRecipe`, `/exploreRecipes`, `/viewRecipes` — note `/exploreRecipes` and `/viewRecipes` don't correspond to real routes, and `/recipe/[id]` delete/edit actions are NOT in this list, so route-level protection differs from the per-action `userId` ownership checks done inside server actions).
- **Database**: Postgres via `drizzle-orm` + the `postgres` driver (`src/lib/db.ts`, `POSTGRES_DB_URL`). Schema lives in `src/db/schema/schema.ts`. Migrations are managed with `drizzle-kit` (`drizzle.config.ts`, output to `./migrations`) — there's no `db:generate`/`db:push` npm script defined, so run `drizzle-kit` directly (`npx drizzle-kit generate` / `npx drizzle-kit push`) if you change the schema.
- **File storage**: AWS S3 via presigned URLs. The client requests a signed PUT URL from a server action, uploads directly to S3, then persists the resulting URL as a `media` row. Every place that needs S3 (`createRecipe/actions.ts`, `recipe/[id]/action.ts`, `editRecipe/[id]/action.ts`) constructs its own `S3Client` — if S3 logic needs to change, it currently has to change in all three places.
- **Forms**: `react-hook-form` (uncontrolled fields via `register`) mixed with plain `useState` for dynamic list fields (ingredients/steps) — see `createRecipe/page.tsx` for the pattern.

## Project structure

- `src/app/` — App Router pages. All page components are `'use client'` — there is no server-rendered metadata; page titles are set client-side via `usePageTitle`.
  - `page.tsx` — home page: recipe grid, live/debounced search, client-side pagination (16/page).
  - `createRecipe/`, `editRecipe/[id]/`, `recipe/[id]/`, `userProfile/[id]/` — one folder per route, each with its own `page.tsx` + colocated `action.ts`/`actions.ts` (server actions, `'use server'`).
  - `components/` — shared client components: `recipe.tsx` (recipe card), `navbar.tsx`, `pagination.tsx`, `skeletons.tsx`, `deleteConfirmModal.tsx`, `usePageTitle.ts`, `shareButton.tsx`.
- `src/db/schema/schema.ts` — single source of truth for all tables (NextAuth tables + `recipe`, `category`, `media`).
- `src/lib/db.ts` — Drizzle client instance.
- `src/auth.ts` — NextAuth config (see above).
- `src/components/ui/` — shared low-level UI primitives (shadcn-style).

## Data model notes

- `recipe.ingredients` and `recipe.steps` are stored as single comma-joined `text` columns, not normalized tables or JSON — UI code splits on `,` and trims (`recipe.ingredients.split(',').map(s => s.trim())`). Keep this convention when touching ingredient/step logic rather than introducing a different serialization.
- `recipe.media` is a nullable FK to `media.id`; deleting a recipe should also delete its `media` row and the underlying S3 object (see `deleteRecipe` in `recipe/[id]/action.ts` for the reference implementation — ownership check, delete recipe row, then clean up media/S3).
- Ownership checks (`session.userId === recipe.userId`) are done ad hoc inside each server action, not via a shared helper — replicate the existing check style when adding new mutations.

## Known rough edges (worth knowing, not necessarily worth fixing opportunistically)

- `.env` and `.env.local` both exist and define overlapping-but-differently-named variables (e.g. `.env.local` has an unused `AWS_BUCKET_NAME`/`AWS_BUCKET_REGION` while the actual code reads `MY_AWS_BUCKET_NAME`/`MY_AWS_BUCKET_REGION` from `.env`). If S3 uploads mysteriously fail, check which file is actually supplying the `MY_AWS_*` vars.
- There are three near-duplicate `S3Client` construction blocks and repeated signed-URL logic across `createRecipe/actions.ts`, `recipe/[id]/action.ts`, and `editRecipe/[id]/action.ts`. A shared `src/lib/s3.ts` would remove the duplication if you're touching more than one of these files.
- Several server actions still have leftover `console.log` debug statements (e.g. `editRecipe/[id]/action.ts`). Fine to leave, but don't add more when writing new server actions — prefer removing them if you're already editing that function.
- `authConfig`'s protected-route list includes paths that don't exist as routes (`/exploreRecipes`, `/viewRecipes`) and doesn't cover the delete/edit *actions* on `/recipe/[id]` — those actions are protected on the server (ownership check throws/returns an error), just not by the route middleware. Don't assume middleware alone guards recipe mutations.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (also type-checks and lints)
- `npm run lint` — ESLint (next/core-web-vitals config)
- No test suite is configured.
