# 🍲 CookBook+

CookBook+ is a Next.js 14 (App Router) recipe-sharing app. Sign in with GitHub, create, edit, and delete your own recipes with photos, browse and search everyone else's recipes, favourite the ones you love, and share recipe links straight into the app from your phone's share sheet.

## Features

- GitHub sign-in (NextAuth v5) with per-action ownership checks on every recipe mutation
- Create, edit, and delete recipes with ingredients, step-by-step instructions, and photo uploads to S3
- Home page recipe grid with live/debounced search and pagination
- Favourite recipes and view them on a dedicated favourites page
- Per-user profile pages listing recipes you've created
- Installable PWA with a share target — share a recipe URL from another app/site and it opens directly in "create recipe" pre-filled
- On iOS, where Safari doesn't support web share targets directly, you can set up an iOS Shortcut that sends the shared link to CookBook+ the same way, letting you add recipes straight from the share sheet

## Tech stack

- **Framework**: Next.js 14.2 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS + a small shadcn/ui-derived component set
- **Auth**: NextAuth v5 (beta), GitHub provider, Drizzle adapter
- **Database**: PostgreSQL via Drizzle ORM
- **File storage**: AWS S3 (presigned upload URLs)
- **Forms**: react-hook-form

## Checkout the live version

https://recipe-tracker-pcw2.vercel.app/

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (type-checks and lints too)
- `npm run lint` — ESLint
