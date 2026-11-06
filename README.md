# Patent Review Console

A small companion app to [hannahhkyme/ai-patent-analyzer](https://github.com/hannahhkyme/ai-patent-analyzer).

AI Patent Analyzer helps inventors build provisional patent disclosures. This console is the reviewer's side: a read-only queue of disclosures showing status, completeness, inventor and last update, plus a detail panel with missing sections and review notes.

It uses deterministic local fixture data only. There are no external services, credentials, environment variables or database, and it makes no calls to the upstream API.

## Shared contract

[`lib/contracts/ai-patent-analyzer.ts`](lib/contracts/ai-patent-analyzer.ts) documents the upstream endpoints and response types this console expects:

| Method | Path | Type | Fields used |
| --- | --- | --- | --- |
| GET | `/api/invention/status/[session_id]` | `StatusResult` | `completeness_score`, `sections_complete`, `sections_missing`, `ready_to_file` |
| POST | `/api/invention/analyze` | `AnalyzeResult` | `completeness_score`, `missing_sections`, `risk_assessment`, `recommendations` |

It is a hand-maintained mirror of upstream `lib/api-reference.ts` and `lib/invention/types.ts` (pinned in `UPSTREAM_CONTRACT_REF`). The fixtures in [`lib/fixtures/disclosures.ts`](lib/fixtures/disclosures.ts) are typed against it, so if the contract drifts, compare the two repos and update this file and the fixtures together.

## Stack

Next.js 15 (App Router), React 19, TypeScript, plain CSS. No other runtime dependencies.

## Commands

Requires Node.js 20+.

```bash
npm install        # install dependencies
npm run dev        # dev server on http://localhost:3000
npm run lint       # ESLint (next/core-web-vitals + next/typescript)
npm run typecheck  # tsc --noEmit
npm run build      # production build
npm start          # serve the production build on http://localhost:3000
```

## Regression tests

```bash
npm test                 # Vitest: contract, fixture invariants, ReviewConsole component
npm run test:e2e:docker  # Playwright E2E + visual baselines (desktop + mobile) in the pinned image
npm run test:e2e:update  # re-generate screenshot baselines after an intentional UI change
npm run test:all         # lint + typecheck + unit + e2e
npm run record:docker    # walkthrough video -> artifacts/walkthrough-<date>.webm
```

- Screenshot baselines live in `e2e/__screenshots__/` and are rendered in
  `mcr.microsoft.com/playwright:v1.64.1-noble` (`scripts/pw-docker.sh`) so they
  match on any machine. Run `test:e2e` without Docker only for debugging.
- `.github/workflows/ci.yml` runs every check on each PR and push to `main`.
- `.github/workflows/weekly-walkthrough.yml` runs the suite every Monday and
  uploads the walkthrough video, screenshots and test reports as an artifact.
  The video's title card shows the commit and pass counts from `reports/`.

## Layout

```
app/                     layout, page, global styles
components/ReviewConsole.tsx   queue table + detail panel (client component)
lib/contracts/           upstream AI Patent Analyzer API contract
lib/fixtures/            deterministic review-queue fixture data
tests/unit/              Vitest unit + component tests
e2e/                     Playwright E2E + visual regression specs and baselines
scripts/                 pinned Playwright Docker wrapper, walkthrough recorder
```
