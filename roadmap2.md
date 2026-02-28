# Drawlulu: Strategic Assessment & Roadmap

## State of the App

The core game loop is solid. The tech choices are defensible (Liveblocks for realtime, Clerk for auth, Neon + Drizzle for the DB, FAL for image gen). The codebase is reasonably clean. Multi-round support just landed. **The game works.** The gap between "works" and "worth sharing" is now almost entirely product and UX, not infrastructure.

---

## What Will Kill You in the First Real Session

Before anything else, three things will actively harm adoption:

**1. Auth friction on join.**
Guests need a Clerk account before they can join a friend's game. For a party game, this is a conversion wall. The host invites 4 friends, 2 of them bounce because they don't want to sign up. The current model requiring full auth to *join* (not just create) is the single highest-leverage fix.

**2. No shareable invite link.**
The lobby shows a 6-character room code. The host has to communicate it out-of-band (DM, verbal, screenshot). A "Copy Link" button that copies `https://drawlulu.vercel.app/game/XXXXXX` is ~20 minutes of work and has outsized impact.

**3. The GENERATING phase has no error recovery.**
If FAL fails or times out, the game hangs in "Generating Images..." forever with no escape hatch. The host can't skip it. This will silently kill a real session.

---

## Roadmap

### Phase 1 — "Safe to share with friends" (do first)

These are cheap wins or must-fixes before inviting real users.

| Work | Effort | Impact |
|---|---|---|
| Copy invite link button in Lobby | 30 min | Very high — direct funnel improvement |
| GENERATING phase error recovery + host skip | 1–2 hr | Very high — prevents dead sessions |
| Mobile layout audit + fixes | 1–2 days | High — party games happen on phones |
| Guest join (username only, no Clerk account) | 2–3 days | Very high — biggest adoption unlock |

**On guest join:** The Clerk auth requirement is baked into `ensureUser` and the `users` table, but it's not irrevocable. The cleanest path is a Clerk [Guest Mode](https://clerk.com/docs/custom-flows/guest-users) which creates ephemeral Clerk users automatically — they get a real `userId` without needing to sign up, and the rest of your code is unchanged. The host still needs a real account (game is persisted to their record), but joiners don't. This is probably a day's work, not a full auth overhaul.

---

### Phase 2 — "Compelling game loop" (next 2 weeks)

These are quality-of-life improvements that determine whether people come back.

**Reveal moment between images.** Right now the game transitions immediately to the next image when the timer expires. Players never see the original prompt the prompter wrote. Adding a brief (5-10s) "reveal" state between guessing rounds — showing the word, the sanitized prompt, the image, and who guessed correctly — would make the game feel cohesive and give people something to react to.

**Guess feed improvement.** Currently incorrect guesses show the actual wrong text, visible to everyone. This is fine for some groups but strategy-breaking for others. Consider hiding wrong guesses behind a "X players have guessed" counter (show only correct + count), or make it a host option. This changes gameplay dynamics significantly.

**Phase transition animations.** Right now phases swap abruptly. Even basic CSS transitions (fade/slide) would make the game feel much more polished. The riso aesthetic is strong — animate into it.

**Score animation on scoreboard.** Numbers counting up, staggered player reveals, a brief winner callout. Currently the scoreboard renders static. This is the moment players feel the payoff.

**Image preloading.** When the game enters GUESSING, all `N` prompt images could be preloaded in the background so the transitions between images are instant. Currently each image loads fresh when `currentPromptIndex` advances.

---

### Phase 3 — "Reason to play again" (3–4 weeks out)

Retention hooks and content.

**Custom words.** Let the host type in their own target words. This is the single highest-engagement feature for repeat play — "let's do one with TV shows from our childhood" or "let's do our friend group as the words." The data model already supports it (wordCards can have `source: user`). The host just needs a text input in the lobby to add words alongside the category picker.

**Content volume.** The app currently has 3 categories. The cron job for AI card generation presumably exists but its health is unclear. The bottleneck for long-term replay value is word card quantity. Either verify the cron is generating and deploying new cards regularly, or build a lightweight admin UI to seed new ones.

**Post-game gallery.** After the scoreboard, a "Gallery" button that shows all images + their original prompts + the target word. This is shareable content — people screenshot it. It also creates a natural loop ("play again so we can see everyone's").

---

## Refactors Worth Doing

These aren't urgent but will pay dividends as complexity grows:

**Extract a `useGameState` hook from `page.tsx`.** At 356 lines, `page.tsx` is doing phase orchestration, timer control, Liveblocks mutations, API calls, and redirect logic simultaneously. Extracting the state machine — the `handleStart`, `handleNewGame`, `handlePlayAgain`, all mutations, the host detection, the presence sync — into a dedicated hook would make the component readable and the logic testable. This is also where presence/storage sync bugs live; isolating the logic makes them visible.

**Zod validation on API routes.** The API routes currently do bare-string parsing with no schema validation at entry. Adding Zod to the 3–4 routes that take non-trivial bodies (`/start`, `/prompt`, `/guess`) gives better error messages, catches bad inputs early, and makes the interface self-documenting.

**Transaction wrap on `/start`.** The round creation flow (insert round, assign cards, update `currentRoundId`) is currently several independent DB writes. A failure midway leaves the game in an inconsistent state. Wrapping in `db.transaction()` is a 5-line fix with real correctness value.

**Timer failure recovery.** `useGameTimer` has a `phaseTransitionRef` debounce that can get stuck if the transition API call fails. Add a timeout fallback: if a phase transition hasn't completed within N seconds, reset the ref and allow retry. Currently a failed transition silently blocks the game.

---

## Refactors Not Worth Doing

- **Replacing Liveblocks** — the realtime foundation is solid and the presence/storage model is well-understood
- **Migrating auth** — Clerk is good; the issue is guest access, not the auth provider itself
- **Moving to a different ORM** — Drizzle is excellent and the query patterns are clean
- **SSR for game phases** — the game is inherently client-driven; fighting Next.js to SSR it buys nothing

---

## Priority Order Summary

```
1. Copy invite link button           (~30 min, do today)
2. GENERATING error recovery         (~2 hr, do this week)
3. Mobile layout pass                (~1-2 days)
4. Guest join via Clerk guest mode   (~1 day, biggest adoption unlock)
5. Reveal phase between images       (~1 day, biggest gameplay improvement)
6. Custom word input for host        (~1-2 days, biggest retention unlock)
7. useGameState refactor             (~2 days, pays dividends in everything after)
8. Score animation + transitions     (~1 day)
9. Post-game gallery                 (~1-2 days)
10. Content expansion / cron health  (ongoing)
```

The top 4 items are the "safe to share publicly" threshold. Items 5–9 are what make people *want* to play again. The `useGameState` refactor is the one that makes building 5–9 less painful — there's a real argument for doing it before the gameplay improvements rather than after.
