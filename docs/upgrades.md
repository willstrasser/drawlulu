# Upgrade playbook

How to take a Dependabot PR (or a manual major bump) from open to merged with the smallest blast radius.

## The default loop

For any single Dependabot PR — patch, minor, or grouped:

```bash
gh pr checkout <PR-#>
pnpm install --frozen-lockfile
pnpm check        # lint · type-check · format:check · unit tests
```

If `check` is green, that's enough for patch and minor bumps. CI runs the same gate. Merge.

For grouped majors or anything in `next-react`, `liveblocks`, `drizzle`, or `tooling`, run the relevant section below before merging.

## `next-react` group (Next.js, React, eslint-config-next, react types)

Next ships a codemod CLI that automates almost every breaking change.

```bash
pnpm dlx @next/codemod@canary upgrade latest
```

The codemod:
- Bumps `next`, `react`, `react-dom`, `eslint-config-next` together.
- Applies AST migrations (e.g. async `params`, `cookies()` shape changes, `Image` import path moves).
- Prompts before each step.

Then run:

```bash
pnpm dlx types-react-codemod@latest preset-19 .   # only on a React major
pnpm format
pnpm check
```

Manual checks:
- `app/game/[code]/PhaseRouter.tsx` and `GamePage.tsx` — Liveblocks `useStorage` projection types may shift; watch for `as unknown as` regressions.
- `lib/iron-session.ts` — if Next changes `cookies()` return type, the `as never` cast may become unnecessary or need re-typing.
- `app/.well-known/vercel/flags/route.ts` — re-evaluate the `getProviderData` cast.
- Run the dev server and complete one full round in two browser windows (lobby → prompt → generate → guess → reveal → scoreboard → play again).

## `liveblocks` group (`@liveblocks/*`)

Liveblocks publishes versioned upgrade guides at https://liveblocks.io/docs/upgrade.

```bash
pnpm add @liveblocks/client@latest @liveblocks/node@latest @liveblocks/react@latest
```

Then run:

```bash
pnpm check
```

Manual checks:
- `liveblocks.config.ts` — `Presence`, `Storage`, `UserMeta` typings.
- `hooks/useStorageMutations.ts` — the `storage.get` / `storage.set` API is the friction point. If the readonly projection signature changes again, rewrite the mutation here, not at every call site.
- Multi-player smoke test (two browser windows). Verify presence sync, `currentGuesses` array updates, and storage.set persistence on phase transitions.

## `drizzle` group (drizzle-orm + drizzle-kit)

```bash
pnpm add drizzle-orm@latest drizzle-kit@latest
pnpm check
pnpm db:generate -- --dry-run   # preview any new migrations
```

Manual checks:
- `lib/db/schema.ts` — column helpers (`text`, `uuid`, `jsonb`) sometimes change generic signatures.
- Test branch: `pnpm test:db:setup` should still create the schema cleanly. If it fails, check the migration produced by `db:generate` against the previous shape.
- `app/api/games/[code]/start/route.ts` — the transaction API is most likely to drift; smoke a full round.

## `tooling` group (vitest, eslint, prettier, playwright, typescript, tsx)

These are usually safe individually. Sequence:

```bash
pnpm add -D <package>@latest
pnpm check
```

If TypeScript bumps and you see new strictness errors in code you didn't touch, that's expected — fix or open an issue. Don't add `// @ts-expect-error` to silence; those rot.

If Prettier bumps and `format:check` fails, run `pnpm format` and re-commit.

For `@playwright/test`, also reinstall browsers in CI if the version delta is large:

```bash
pnpm exec playwright install chromium
```

## What NOT to do

- **Never merge a major Dependabot PR without running `check` locally.** CI catches regressions but won't surface deprecation warnings or API drift in unwatched paths.
- **Never bump `iron-session` past a major without manually testing OAuth + guest signup + signout.** The cookie-store interface is the most fragile boundary in the app.
- **Never bypass `pnpm format` after a Prettier major.** Re-run, commit the diff as a separate PR.
- **Don't auto-merge majors.** Patches and minors via Dependabot are safe with green CI; majors deserve a human eyeball on the changelog.

## When a major is too big for one PR

If the codemod doesn't cover everything (e.g. a Next major that removes a feature you use), split the work:

1. Create a feature branch off main.
2. Apply the codemod on a clean tree.
3. Land the structural prerequisites (route handler shape changes, etc.) on main first as separate PRs.
4. Rebase the codemod branch and merge.

## Local Node version

`.nvmrc` pins Node 20. If you have `nvm`:

```bash
nvm use
```

or with `fnm`:

```bash
fnm use
```

CI reads `.nvmrc` directly via `actions/setup-node@v4` with `node-version-file`, so the local + CI Node versions can never drift.
