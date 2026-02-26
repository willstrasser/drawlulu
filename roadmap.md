# Drawlulu Roadmap — Areas of Improvement

## 1. N+1 Query Problem in API Routes

The `scores` and `round-prompts` routes fetch users one-by-one inside loops. For example in `app/api/games/[code]/scores/route.ts`, user lookups happen per-prompt and per-guess, creating O(prompts × guesses) DB round-trips. Batch-load all relevant users upfront with a single `WHERE IN` query and build a lookup map.

Same issue in `round-prompts/route.ts` — it does `Promise.all` over individual user lookups instead of a join or batch fetch.

## 2. Duplicate User Upsert Logic

The user upsert pattern (select-then-insert) is copy-pasted across `app/api/games/route.ts`, `app/api/games/[code]/join/route.ts`, and `lib/ensure-user.ts`. The `ensureUser` helper already exists and uses `onConflictDoUpdate`, but the two API routes don't use it — they have a simpler (and less robust) version without the upsert on conflict. Consolidate these to all use `ensureUser`.

## 3. Race Condition in Guess Scoring

In `app/api/games/[code]/guess/route.ts`, the rank-based scoring reads the count of existing correct guesses and then inserts a new one. Two simultaneous correct guesses could read the same count and both get the 1st-place score (100 pts). This should be wrapped in a transaction (or use a DB-level count at insert time).

## 4. `roundNumber` is Always Hardcoded to 1

In `app/api/games/[code]/start/route.ts`, `roundNumber` is always `1`. "Play Again" creates a new round but still sets `roundNumber: 1`. To support multi-round games, query the max round number for that game and increment.

## 5. Duplicate "Breaking Bad" Card

In `lib/words.ts`, "Breaking Bad" appears twice in the TV Shows category. This means it's more likely to be selected than other cards, and two players could get the same target word in the same round.

## 6. No Authorization Check on `/generate`

`app/api/games/[code]/generate/route.ts` authenticates that the caller is logged in, but doesn't verify they're the host. Any authenticated player could trigger image generation by calling the endpoint directly.

## 7. `GameRoom` Component is a 400-line God Component

`app/game/[code]/page.tsx` handles all game logic — phase transitions, data fetching, timer management, Liveblocks mutations, and rendering. Consider extracting:
- A custom hook for the phase-transition/timer logic (the `handleTimerEnd` + refs + effects)
- A custom hook for the data-fetching effects (assignment, prompts, scores)

## 8. No Error Handling on Failed Image Generation

In `app/api/games/[code]/generate/route.ts`, if fal.ai fails for a prompt, `Promise.allSettled` silently swallows the rejection. Players whose prompts failed get no image and no feedback. The game continues with `null` image URLs, showing "No image generated" in the guessing phase with no way to retry.

## 9. Taboo Word Validation Only Checks Exact Substrings

`validateTabooWords` in `lib/utils.ts` does a simple regex match. Players could bypass taboo words with zero-width characters, leetspeak ("J3di"), or splitting words across sentences. Also, the target word itself isn't checked — a player could type "Star Wars" as their prompt and it won't be flagged (only the 10 listed taboo words are checked).

## 10. `img` Tags Instead of `next/image`

The game page and components use raw `<img>` tags for user avatars and AI-generated images, missing out on Next.js image optimization (lazy loading, responsive sizing, format conversion). Remote patterns are already configured in `next.config.ts` for fal.ai and Clerk.

## 11. No Cleanup for Stale Games

There's no mechanism to clean up abandoned games. If a host creates a game and never starts it, or players disconnect mid-game, the DB accumulates stale records indefinitely. A scheduled cleanup or TTL would help.

---

**Highest-impact changes:** #1 (N+1 queries — will slow down noticeably with more players), #3 (race condition is a correctness bug), and #7 (developer velocity for a component that complex).
