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
- **Accessibility is part of design, not separate from it**: modals need `role`, `aria-*`, focus trapping and restoration, and Escape handling (see `deleteConfirmModal.tsx`); interactive elements need visible focus states; images need meaningful `alt` text. `globals.css` has base-layer rules that auto-apply `cursor: pointer` to buttons/links/interactive controls and a visible `:focus-visible` ring to `button`/`[role='button']`/`[role='link']`/`a[href]` — don't fight these with inline `cursor-*` overrides, and don't skip focus states on custom interactive elements assuming the global rule covers it (it only covers elements with those exact selectors/roles).
- **Clickable, non-button containers** (e.g. `Recipe` card in `components/recipe.tsx`, which navigates to the recipe detail page when you click anywhere on the card) need the full treatment to be a real interactive element, not just `onClick` + `cursor-pointer`: `role='link'` (or `'button'`), `tabIndex={0}`, an `onKeyDown` handler for Enter/Space, and an `aria-label` describing the destination. Nested truly-interactive children (buttons, the modal) must call `stopPropagation` on their own click/keydown handlers so they don't also trigger the container's action — this includes portal-rendered content like `DeleteConfirmModal`, since React's synthetic events bubble through the *component* tree, not the DOM tree, so a portaled modal's clicks still reach an ancestor's `onClick` unless explicitly stopped.
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
- Ownership checks (`session.userId === recipe.userId`) are done ad hoc inside each server action, not via a shared helper — replicate the existing check style when adding new mutations. **Always check ownership before mutating**, by reading the existing row first — don't write, then check, then reject, since the write already happened by that point (this was a real bug in `updateRecipe`, fixed by reading the row, checking ownership, and only then issuing the `update`).
- Delete controls are intentionally scoped by page, not by ownership alone: `Recipe` (`components/recipe.tsx`) takes a `showDeleteButton` prop that defaults to `false`. The home page (`page.tsx`) does not pass it — recipes can only be deleted from `userProfile/[id]/page.tsx` ("My Recipes") or from the recipe's own detail page. If you add a new place that lists `Recipe` cards, default to `showDeleteButton={false}` unless that page is specifically the user's own recipe management view.
- Buttons inside a `<form>` (ingredient/step "remove" buttons, image-remove buttons, etc.) must have `type='button'` explicitly — without it, the default `type='submit'` fires the form's `onSubmit`/RHF validation instead of just running the button's `onClick`. This has bitten this codebase before; when adding a new button inside `createRecipe/page.tsx` or `editRecipe/[id]/page.tsx`, set `type='button'` unless it's the actual submit button.

## PWA / installability

- `public/manifest.webmanifest` declares the app as installable (`display: standalone`) and registers it as a **share target** (`share_target.action: /api/share-target`, method `POST`, `multipart/form-data`, params `title`/`text`/`url`). This is how CookBook+ shows up in the OS share sheet when sharing a recipe URL from another site/app.
- `src/app/api/share-target/route.ts` handles the `POST`, extracts the first URL-looking token from `url`/`text`/`title` (in that priority order), and redirects (303) to `/createRecipe?sharedUrl=...&sharedTitle=...`.
- **A share target only appears in the OS share sheet if the PWA is actually installed**, and on Android/Chrome, installability requires a registered service worker — this is a hard platform requirement, not something `manifest.webmanifest` alone can satisfy. `public/sw.js` (a minimal network-first-with-cache-fallback worker) exists solely to satisfy this; it is registered client-side in `components/navbar.tsx` (`navigator.serviceWorker.register('/sw.js')`, fired once on mount since `Navbar` is rendered globally from `layout.tsx`). If the share target "disappears" or a fresh clone doesn't show up in the share sheet, check that `sw.js` is still being served and registered before assuming the manifest is broken.
- After changing `sw.js` or the manifest, the installed PWA generally needs to be **reinstalled/re-added to the home screen** for the OS to pick up the new service worker registration and re-evaluate share-target eligibility — this isn't a bug, just how PWA installability caching works.
- `layout.tsx` sets `viewport.viewportFit: 'cover'` and `appleWebApp.statusBarStyle: 'black-translucent'`, meaning the app deliberately draws under the notch/status bar/home-indicator area. Because of this, `globals.css`'s base `body` rule must apply `env(safe-area-inset-*)` padding on **all four sides** (`top`, `right`, `bottom`, `left`) — the top inset was missing for a while and caused content to sit flush against the status bar in installed/standalone PWA mode. If you touch this rule, keep all four sides present; losing any one of them reproduces a real visual bug specifically in installed-PWA/notched-device contexts, not in a normal browser tab.

## Known rough edges (worth knowing, not necessarily worth fixing opportunistically)

- `.env` and `.env.local` both exist and define overlapping-but-differently-named variables (e.g. `.env.local` has an unused `AWS_BUCKET_NAME`/`AWS_BUCKET_REGION` while the actual code reads `MY_AWS_BUCKET_NAME`/`MY_AWS_BUCKET_REGION` from `.env`). If S3 uploads mysteriously fail, check which file is actually supplying the `MY_AWS_*` vars.
- There are three near-duplicate `S3Client` construction blocks and repeated signed-URL logic across `createRecipe/actions.ts`, `recipe/[id]/action.ts`, and `editRecipe/[id]/action.ts`. A shared `src/lib/s3.ts` would remove the duplication if you're touching more than one of these files.
- `authConfig`'s protected-route list includes paths that don't exist as routes (`/exploreRecipes`, `/viewRecipes`) and doesn't cover the delete/edit *actions* on `/recipe/[id]` — those actions are protected on the server (ownership check throws/returns an error), just not by the route middleware. Don't assume middleware alone guards recipe mutations.
- Avoid leftover `console.log` debug statements in server actions and client handlers — several were cleaned up (`editRecipe/[id]/action.ts`, `editRecipe/[id]/page.tsx`, `app/action.ts`); don't reintroduce the habit. `console.error` in a `catch` block is fine and expected.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (also type-checks and lints)
- `npm run lint` — ESLint (next/core-web-vitals config)
- No test suite is configured.
