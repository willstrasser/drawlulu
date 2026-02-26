# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Drawlulu is a multiplayer AI image-guessing game (like Taboo meets AI art). Players write prompts to generate AI images while avoiding taboo words, then other players guess the target word from the generated image. Built with Next.js 16 (App Router), Liveblocks for real-time multiplayer, Clerk for auth, Drizzle ORM + Neon PostgreSQL for persistence, and fal.ai (Flux Schnell) for image generation.

## Build & Development Commands

- `npm run dev` — Start local dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npx drizzle-kit push` — Push schema changes to the database
- `npx drizzle-kit generate` — Generate SQL migrations
- `npx drizzle-kit studio` — Open Drizzle Studio to inspect the database

## Required Environment Variables

See `.env.local.example` for the full list: Clerk keys, `DATABASE_URL` (Neon PostgreSQL), `LIVEBLOCKS_SECRET_KEY`, and `FAL_KEY`.

## Architecture

### Dual State Model

The app uses two complementary state systems:

- **Liveblocks (real-time, ephemeral):** Game phase, timer, current prompt index, live guesses, player presence. Configured in `liveblocks.config.ts`. The room ID is `game-{roomCode}`. The host (first player to join) drives phase transitions via timer callbacks on the client.
- **PostgreSQL/Drizzle (persistent):** Users, games, rounds, prompts (with target/taboo words, AI-generated image URLs), and guesses with scoring. Schema in `lib/db/schema.ts`.

Client components read Liveblocks storage for UI state, and fetch from API routes for DB-persisted data (assignments, round prompts, scores) when phases change.

### Game Flow (Phases)

Defined in `lib/phases.ts`: `lobby` → `prompting` (60s) → `generating` → `guessing` (30s per image) → `scoreboard`.

The host client manages phase transitions via timer expiry in `app/game/[code]/page.tsx`. When all players submit prompts early, the timer is skipped. During `generating`, the host calls `POST /api/games/[code]/generate` which runs fal.ai image generation for all prompts in parallel.

### API Routes

All under `app/api/games/`:
- `POST /api/games` — Create game + room code
- `POST /api/games/[code]/join` — Join a lobby
- `POST /api/games/[code]/start` — Host starts round, assigns random taboo cards to players
- `GET /api/games/[code]/my-assignment` — Player fetches their prompt assignment
- `POST /api/games/[code]/prompt` — Submit prompt text (validates taboo words via `lib/utils.ts`)
- `POST /api/games/[code]/generate` — Generate images for all prompts via fal.ai
- `GET /api/games/[code]/round-prompts` — Fetch all prompts with images for guessing phase
- `POST /api/games/[code]/guess` — Submit a guess (scoring in `lib/scoring.ts`)
- `GET /api/games/[code]/scores` — Fetch round scores and per-prompt breakdowns
- `POST /api/liveblocks-auth` — Liveblocks session auth (uses Clerk identity)

All API routes authenticate via Clerk's `auth()` and resolve DB users via `lib/ensure-user.ts` (upserts from Clerk).

### Scoring System (`lib/scoring.ts`)

- Prompter gets 50 base points if anyone guesses correctly, minus 25 per taboo word used.
- Guessers get points by rank: 1st=100, 2nd=75, 3rd=50, 4th=30, 5th=20, 6th+=10.

### Taboo Word Content (`lib/words.ts`)

Categories (Movies, Pop Singers, TV Shows) with cards containing an objective word and 10 taboo words each. `getRandomCards()` shuffles and selects cards for a round.

### Styling

Tailwind CSS v4 with a riso-print-inspired theme. Custom colors (`riso-teal`, `riso-red`, `riso-yellow`, `riso-purple`, `riso-cream`) defined in `app/globals.css` via `@theme inline`. Buttons use a consistent raised shadow pattern with press-down animation. Background has floating blurred blobs and a noise texture overlay.

### Key Patterns

- Path alias `@/*` maps to the project root.
- Next.js 16 route params are `Promise`-based (use `await params` in API routes, `use(params)` in client components).
- Components in `components/game/` correspond to game phases. `DevPanel` is shown in dev mode or for specific Clerk user IDs.
- Liveblocks typed hooks (`useStorage`, `useMutation`, `useMyPresence`, etc.) are exported from `liveblocks.config.ts`, not imported from `@liveblocks/react` directly.
