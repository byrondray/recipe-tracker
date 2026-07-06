# 🍲 CookBook+

CookBook+ is a Next.js 14 (App Router) recipe-sharing app. Sign in with Clerk, create, edit, and delete your own recipes with photos, rate and review other users' recipes, browse and search everyone else's recipes, favourite the ones you love, and share recipe links straight into the app from your phone's share sheet — including AI-assisted import from Instagram captions.

## Features

- Clerk sign-in with per-action ownership checks on every recipe mutation
- Create, edit, and delete recipes with ingredients, step-by-step instructions, and photo uploads to S3
- Star ratings and written reviews on other users' recipes
- Home page recipe grid with live/debounced search (title, ingredients, category), category and minimum-rating filters, sorting, and pagination
- Favourite recipes and view them on a dedicated favourites page
- Per-user profile pages listing recipes you've created
- Installable PWA with a share target — share a recipe URL from another app/site and it opens directly in "create recipe" pre-filled; Instagram post captions are parsed into a structured recipe via Claude
- On iOS, where Safari doesn't support web share targets directly, you can set up an iOS Shortcut that sends the shared link to CookBook+ the same way, letting you add recipes straight from the share sheet

## Tech stack

- **Framework**: Next.js 14.2 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS + a small shadcn/ui-derived component set
- **Auth**: Clerk
- **Database**: PostgreSQL via Drizzle ORM
- **File storage**: AWS S3 (presigned upload URLs)
- **Forms**: react-hook-form
- **AI**: Anthropic API (Instagram caption → recipe extraction)

## Checkout the live version

https://recipe-tracker-pcw2.vercel.app/

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (type-checks and lints too)
- `npm run lint` — ESLint
- `npm run db:generate` — generate a Drizzle migration from schema changes
- `npm run db:push` — push schema changes directly to the database
- `npm run db:seed` — reset and reseed the category list
