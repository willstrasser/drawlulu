# Drawlulu

A multiplayer AI image-guessing party game. Each round you're handed a secret word (say, "Sun") and a list of taboo words you can't use ("Star", "Hot", "Light"). You write a prompt; fal.ai turns it into an image; everyone else tries to guess your word from what came out.

## Stack

- **Next.js 16** App Router · React 19 · TypeScript
- **Liveblocks** for real-time room state (phase, timer, guesses, presence)
- **Neon Postgres** + **Drizzle ORM** for users / games / rounds / scores
- **fal.ai** (Flux Schnell) for image generation
- **iron-session** for auth (guest + optional Google OAuth)
- **Tailwind v4** in a riso-print theme

## Quick start

Prereqs: Node 20+, then [Corepack](https://nodejs.org/api/corepack.html) (ships with Node) provisions pnpm automatically.

```bash
pnpm install
cp .env.local.example .env.local   # fill in keys
pnpm db:push                        # apply schema to your dev DB
pnpm dev
```

Open <http://localhost:3000>.

### Environment

`.env.local.example` is the source of truth. Required for the app to boot: `SESSION_SECRET` (32+ chars), `DATABASE_URL`, `LIVEBLOCKS_SECRET_KEY`, `FAL_KEY`, `FLAGS_SECRET`, `CRON_SECRET`. Google OAuth keys are optional — without them players sign in with a guest name only.

## Scripts

- `pnpm dev` — dev server on :3000
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm test` — Vitest unit tests
- `pnpm test:e2e` — Playwright happy-path run (provisions an ephemeral Neon branch per run)
- `pnpm lint` · `pnpm type-check` · `pnpm format`
- `pnpm db:push` · `db:generate` · `db:studio` — Drizzle schema / migrations / inspector
- `pnpm dev:bot` — solo multiplayer testing; spawns headless players via Playwright

## How a round goes

`lobby` → `prompting` → `generating` → `guessing` → `revealing` → `scoreboard`

- **Prompting** (60s): each player writes a prompt for their assigned target word, avoiding the taboo list. Auto-skips as soon as everyone submits.
- **Generating**: host posts to `/api/games/[code]/generate`, which renders all prompts via fal.ai in parallel.
- **Guessing** (30s per image): non-owners try to guess the target word. Auto-skips when every eligible guesser is correct.
- **Scoreboard**: prompters score if anyone guessed correctly (minus a penalty per taboo word used); guessers score by rank order.

## Architecture cheat-sheet

Two state systems run side by side:

- **Liveblocks room** (ephemeral): phase, current image index, timer end, in-flight guesses, presence. The host client drives transitions; storage shape is in `liveblocks.config.ts`.
- **Postgres** (persistent): users, games, rounds, prompts, guesses. Schema in `lib/db/schema.ts`, queries in `lib/db/`.

Phase-specific UI lives in `components/game/`. For the deeper map of API routes, scoring, and conventions see [`AGENTS.md`](./AGENTS.md).

## Testing

- **Unit:** Vitest (`pnpm test`)
- **E2E:** Playwright (`pnpm test:e2e`) — two browser contexts run a full lobby → scoreboard. Each run creates and tears down an ephemeral Neon branch, so tests share schema with prod but never touch its data. Needs Neon API access (see `.env.test`).

## Deploy

Hosted on Vercel. CI runs lint / type-check / format / unit on every PR, plus Playwright E2E. `vercel.json` declares a weekly cron hitting `/api/cron/generate-cards` to auto-grow the word-card catalog.

## Credits

Background music: "Bossa Antigua" by Kevin MacLeod ([incompetech.com](https://incompetech.com)), CC BY 4.0.
