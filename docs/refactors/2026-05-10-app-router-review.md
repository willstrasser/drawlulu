# App Router Review — 2026-05-10

Review of the codebase against three newly-installed agent skills:
`nextjs-app-router-patterns`, `nextjs-best-practices`, `react-performance-optimization`. Applied the missing patterns, deleted dead routes, and consolidated visual styles.

## Final validation

- **Type-check**: clean.
- **Lint**: clean.
- **Format-check**: clean.
- **Tests**: 38/38 unit tests pass.
- **Build**: `npm run build` clean. Routes correctly classified static (`/_not-found`, `/icon.svg`) vs dynamic (everything else, since the home page reads cookies).

Commits: `8f02525` (review pass), `40ff58d` (follow-up create-game dedup).

## Findings (from the skill review)

1. **No route boundaries.** `loading.tsx`, `error.tsx`, `not-found.tsx` were missing for both the root segment and `/game/[code]`. Per the skill: every route should have these.
2. **Home page was fully `"use client"`.** `app/page.tsx` did session fetching client-side via `useSession`, used `setTimeout`-based `pendingAction` retry after the username modal closed, and POSTed to `/api/games` and `/api/games/[code]/join` from the browser.
3. **Mutations were not Server Actions.** Create/join/sign-out went through fetch + REST endpoints when Server Actions are the App Router idiom.
4. **Visual duplication.** The `shadow-[4px_4px_0_*]` stamp button class was hand-rolled in 6+ call sites (Lobby, Scoreboard, PromptPhase, GuessingPhase, UsernameModal, page).
5. **Inline `<style>` in `RevealPhase`.** The `drain` keyframe was injected via a JSX `<style>{...}</style>` block — re-declared on every render.

## Phase 1 — Route boundaries

Added with sensible defaults:

- `app/loading.tsx` — riso-teal spinner.
- `app/error.tsx` — error message + reset button + `log.error("app/error", ...)`.
- `app/not-found.tsx` — 404 + back-home link.
- `app/game/[code]/loading.tsx` — game-themed spinner.
- `app/game/[code]/error.tsx` — error UI with both `reset()` and a back-home escape hatch.

## Phase 2 — Server Actions for game create/join

New file: `app/actions/games.ts`.

- `createGameAction()` — reads session, rate-limits, calls `createLobbyGame`, redirects to `/game/<code>`. Returns `{ error: string | null }` for `useActionState` on failure paths.
- `joinGameAction(prev, formData)` — reads session, validates code, checks lobby state, redirects.
- Shared `ActionState` + `initialActionState` for `useActionState`.

`signOut` (already in `app/actions/auth.ts`) extended to call `revalidatePath("/")` so the home Server Component re-renders after the sign-out form posts.

## Phase 3 — Home page becomes a Server Component

`app/page.tsx` (Server) — reads `getUser()` at request time, renders `<HomeActions user={user} />`.

`app/HomeActions.tsx` (Client island) — renders one of two states:

- **Signed-out:** inline guest-signup form using `signInAsGuest` Server Action plus a Google OAuth link. The previous "click Create → modal pops up → modal saves → setTimeout retries Create" race is gone.
- **Signed-in:** nav with username + a `<form action={signOut}>` sign-out button, plus Create / Join forms each wired through `useActionState`.

`useFormStatus` powers each submit button via `<StampButton>`. Errors from either action surface inline.

## Phase 4 — Visual cleanup

`components/ui/StampButton.tsx` — single source of truth for the riso stamp-shadow button. Variants: `teal` / `purple` / `white`. Sizes: `sm` / `md` / `lg`. Wired into:

- `Lobby.tsx` (Start Game button)
- `Scoreboard.tsx` (Next Round, New Game buttons)
- `PromptPhase.tsx` (Submit button)
- `GuessingPhase.tsx` (Guess button)
- `UsernameModal.tsx` (Let's Play button)
- `HomeActions.tsx` (Create, Join, guest signup buttons)

`RevealPhase.tsx` — inline `<style>{drain}</style>` block deleted; the `@keyframes drain` rule moved into `app/globals.css` next to the existing `@keyframes float`.

## Dead route deletions

- `app/api/auth/signout/route.ts` — only caller was the old client-side home page; replaced by the `signOut` Server Action. Deleted.
- `app/api/games/[code]/join/route.ts` — only caller was the old client-side home page; replaced by `joinGameAction`. Deleted.

`/api/games` POST stays — `useGameActions.handleNewGame` (the in-game "New Game" button on the scoreboard) needs to receive the room code client-side so it can broadcast it via Liveblocks storage *before* navigating, which a redirecting Server Action can't do.

## Follow-up dedup (`40ff58d`)

`createGameAction` and `/api/games` POST were running near-identical retry-on-unique-violation insert loops. Extracted into:

- `lib/db/games.ts#createLobbyGame(hostUserId)` — single source of truth for the insert + retry. Returns the inserted row or `null` if all 10 retries collided.

Rate limiting stays at the caller because the two surfaces want different responses (Server Action returns an `ActionState`; route returns a 429 JSON).

## Files added

```
app/loading.tsx
app/error.tsx
app/not-found.tsx
app/game/[code]/loading.tsx
app/game/[code]/error.tsx
app/HomeActions.tsx
app/actions/games.ts
components/ui/StampButton.tsx
lib/db/games.ts
docs/refactors/2026-05-10-app-router-review.md   (this file)
```

## Files materially changed

```
app/page.tsx                        (Server Component, reads getUser())
app/api/games/route.ts              (uses createLobbyGame)
app/actions/auth.ts                 (signOut + signInAsGuest revalidatePath)
app/globals.css                     (drain keyframe moved here)
components/game/Lobby.tsx           (StampButton)
components/game/Scoreboard.tsx      (StampButton x2)
components/game/PromptPhase.tsx     (StampButton)
components/game/GuessingPhase.tsx   (StampButton)
components/game/UsernameModal.tsx   (StampButton)
components/game/RevealPhase.tsx    (drop inline <style>)
```

## Files deleted

```
app/api/auth/signout/route.ts
app/api/games/[code]/join/route.ts
```

## Deferred

- **Game page (`/game/[code]`) Server Component split.** Needs Liveblocks `RoomProvider` which is client-only, so the wrapping page is already a Server Component but the entire game UI is necessarily a Client island. Acceptable.
- **`useSession` removal in the game page.** The home page no longer uses it; the game page still does because its `UsernameModal` fallback wants client-side reactivity when a player lands on `/game/X` without a session.
- **Lazy-loading `motion/react`.** Skill-suggested perf win, but visually load-bearing across 6 components — splitting introduces flash-of-unanimated-content.
- **`useStorage` selector consolidation into `useGameStore`.** Mentioned in the original 5-phase plan; the 14 individual selectors still work and don't create measurable re-render issues.
- **Suspense streaming inside the game page.** The flow is fully Liveblocks-driven (no server fetches to stream); not applicable.
