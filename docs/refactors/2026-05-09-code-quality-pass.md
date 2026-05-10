# Code-Quality Refactor — 2026-05-09

Comprehensive five-phase refactor of `drawlulu` for overall code quality. Behaviour preserved on the happy path; small drive-by improvements (Zod, transactions, error surfacing) included.

## Final validation

- **Type-check**: clean.
- **Tests**: 38/38 unit tests pass (was 0; vitest was not installed before this refactor).
- **Lint**: 4 issues, all pre-existing in files this refactor did not touch (`hooks/useSession.ts`, `components/game/Timer.tsx`, `proxy.ts`, `e2e/global-setup.ts`).
- **`console.*` outside `logger.ts`**: 0 (was 32).
- **`as unknown as` in `app`/`components`/`hooks`**: 0 (was 5).
- **`GamePage.tsx`**: 441 → 292 lines (−34%).
- **`scores/route.ts`**: 164 → 72 lines (−56%).

## Phase 0 — Safety net

Installed vitest and added `npm test` / `npm run test:watch`. Wrote characterization tests (no implementation changes) for the pure helpers we'd later refactor around: `getPrompterScore`, `getGuesserScore`, `validateTabooWords`, `generateRoomCode`, `getCategories`, `getRandomCards`.

## Phase 1 — Pure extractions

- `lib/cards.ts` — single `WordCard` + `TabooEntry` types and runtime guards. The cron route and `seed-word-cards.ts` now share them; the old `GeneratedCard` and the script-local `Card` were redundant.
- `lib/scoring.ts` — added `computeRoundScores`, `computeCumulativeScores`, `scoreMapToList`. Eliminates the duplicated round-vs-cumulative loops formerly at `scores/route.ts:67–142`.
- `lib/logger.ts` — `log.info/warn/error(scope, msg, …)` wrapper. Replaced all 32 `console.*` calls across `app/`, `components/`, `hooks/`, `lib/`.
- `lib/api/types.ts` — Zod schemas + inferred types for every request and response shape (`Start`, `Prompt`, `Guess`, `MyAssignment`, `RoundPrompts`, `Scores`, `GameInfo`, `Categories`).
- `components/ui/motion-presets.ts` — exports `WOBBLE`, `BOUNCY`, `SETTLE`, `PHASE_SPRING`. Replaced 4+ duplicate inline springs across `PromptPhase`, `GuessingPhase`, `Scoreboard`, `RevealPhase`, `GamePage`.
- `components/game/PhaseError.tsx` — consolidated the three identical fetch-error fallbacks formerly inlined at `GamePage.tsx:311–320, 334–343, 365–374`.

## Phase 2 — Backend consolidation

- `lib/api/with-game-context.ts` — HOF that runs `getUser → loadGameByCode → loadRound → host check → player check` based on a `Policy` object. All 9 routes under `app/api/games/[code]/` now go through it.
- `lib/api/json.ts`, `lib/api/zod.ts` — `jsonResponse`, `errorResponse`, `parseBody` helpers.
- `lib/db/users.ts` — `findUserByOAuth`, `findUserById`, `linkOAuthToUser`, `createOAuthUser`. Used by the OAuth callback (which previously inlined the upsert).
- `app/api/games/[code]/start/route.ts` — round + prompts insert wrapped in `db.transaction`. The O(n²) `playerUserIds.map(id => playerUsers.find(u => u.id === id))` reorder replaced with a single `Map<id, user>` lookup.
- `app/api/games/[code]/guess/route.ts` — prompt re-fetched inside the `SELECT FOR UPDATE` transaction. Closes the TOCTOU between the pre-flight read and lock acquisition.
- `lib/db/word-cards.ts` — single `LIMIT n` query with a category fallback (was two unbounded `ORDER BY RANDOM()` queries).
- `app/api/cron/generate-cards/route.ts` — dropped the `as any` and the `eslint-disable` by using `Anthropic.Messages.WebSearchTool20250305` from the SDK type tree.
- `app/api/auth/callback/google/route.ts` — extracted the user upsert into `lib/db/users.ts`. OAuth failures now surface a structured `reason=` query parameter and log through `log.error` instead of being swallowed by `?error=oauth_failed`.

## Phase 3 — Frontend decomposition

- `hooks/useStorageMutations.ts` — bundled the 8 inline `useMutation` setters formerly in `GamePage.tsx`. Crucially: reading via `storage.get` (mutable) inside the mutation, instead of spreading from the `useStorage` projection (readonly), removed all five `as unknown as Storage[...]` casts at `GamePage.tsx:120–135` without any type-system contortions.
- `hooks/useGameMeta.ts` — extracted the categories + `hostUserId` fetches. Adds `AbortController` cleanup and surfaces fetch errors instead of swallowing them.
- `hooks/useGameActions.ts` — `handleStart`, `handleNewGame`, `handleGuessSubmitted`, `handlePromptSubmitted`, `handleSkipGeneration`. Pure orchestration over `useStorageMutations` + `setMyPresence` + `fetch`.
- `app/game/[code]/PhaseRouter.tsx` — phase-switch presentational component. Consumes `<PhaseError />` from Phase 1.
- `app/game/[code]/GamePage.tsx` — rewritten as a thin coordinator: `useGameStore` selectors, hook wiring, presence-sync effects, nav, dev panel, animated `<PhaseRouter />`.
- `liveblocks.config.ts` `initialStorage` cast replaced with `[] satisfies GuessEntry[]`.

## Phase 4 — Tests

Added unit suites for the new pure code paths. `vitest run` now covers:

- `lib/scoring.test.ts` — `getPrompterScore`, `getGuesserScore` (truth tables); `computeRoundScores` (2-player happy path, no-correct-guess, taboo penalty, ghost-prompter); `computeCumulativeScores` (3-player, 2-round); `scoreMapToList`.
- `lib/utils.test.ts` — `generateRoomCode` alphabet + ambiguity exclusion; `validateTabooWords` (case-insensitivity, multi-word phrases, regex-meta escaping, multiple distinct hits, global replace).
- `lib/words.test.ts` — `getCategories` shape; `getRandomCards` count semantics + category scoping + unknown-category fallback.
- `lib/cards.test.ts` — `isTabooEntry`, `isWordCard` runtime guards.
- `lib/api/zod.test.ts` — `parseBody` happy path, malformed-JSON 400, schema-violation 400 with details.
- `lib/api/with-game-context.test.ts` — auth-boundary contract: `null` user → 401, handler not invoked.

## Deferred items

- **E2E expansion** (rejoin, multi-round, oauth, errors specs) — requires Neon test-branch credentials to run; the HOF's policy enforcement (404, 403) is best validated there.
- **`StampButton` / `GameImage` UI primitives** — would dedupe button class strings and `<Image>` wrappers across `Lobby`, `Scoreboard`, `PromptPhase`, `GuessingPhase`. Modest payoff vs. churn.
- **`ImagePreloader` extraction** from `GuessingPhase` (the hidden-div preload at lines 201–219).
- **`useRoundData` parametrization** — three fetch effects could collapse to one `useRoundFetch(phase, endpoint, parser)` helper.
- **Stripping image-generation `fetch` out of `useGameTimer`** into `useGameActions#advanceFromPrompting`. Risk-reward unfavorable without timer-path test coverage.
- **2 pre-existing lint errors** (`react-hooks/set-state-in-effect` in `Timer.tsx` and `useSession.ts`) — not introduced by this refactor; out of scope.

## Files added

```
docs/refactors/2026-05-09-code-quality-pass.md  (this file)
vitest.config.ts
lib/cards.ts
lib/logger.ts
lib/db/users.ts
lib/api/json.ts
lib/api/zod.ts
lib/api/types.ts
lib/api/with-game-context.ts
hooks/useStorageMutations.ts
hooks/useGameMeta.ts
hooks/useGameActions.ts
components/ui/motion-presets.ts
components/game/PhaseError.tsx
app/game/[code]/PhaseRouter.tsx
lib/scoring.test.ts
lib/utils.test.ts
lib/words.test.ts
lib/cards.test.ts
lib/api/zod.test.ts
lib/api/with-game-context.test.ts
```

## Files materially changed

```
app/game/[code]/GamePage.tsx          (441 → 292 lines)
app/game/[code]/page.tsx              (logger)
app/api/games/[code]/route.ts                (HOF)
app/api/games/[code]/join/route.ts           (HOF)
app/api/games/[code]/start/route.ts          (HOF + transaction + Map reorder)
app/api/games/[code]/prompt/route.ts         (HOF + parseBody)
app/api/games/[code]/my-assignment/route.ts  (HOF)
app/api/games/[code]/round-prompts/route.ts  (HOF)
app/api/games/[code]/guess/route.ts          (HOF + parseBody + TOCTOU fix)
app/api/games/[code]/scores/route.ts         (164 → 72 lines)
app/api/games/[code]/generate/route.ts       (HOF + structured errors)
app/api/auth/callback/google/route.ts        (helper extraction + reason codes)
app/api/cron/generate-cards/route.ts         (drop `as any`, shared types)
lib/scoring.ts                               (extended)
lib/db/word-cards.ts                         (single-query fix)
hooks/useRoundData.ts                        (logger)
hooks/useGameTimer.ts                        (typed phase + logger)
components/game/PromptPhase.tsx              (motion presets + logger)
components/game/GuessingPhase.tsx            (motion presets + logger)
components/game/Scoreboard.tsx               (motion presets)
components/game/RevealPhase.tsx              (motion presets)
components/game/Lobby.tsx                    (logger)
scripts/seed-word-cards.ts                   (shared WordCard type)
package.json                                 (vitest dev dep + scripts)
```
