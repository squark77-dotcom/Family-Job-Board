# Choremate

Choremate is a family contribution app where parents create and review household jobs, children claim and submit work, and approved contributions earn points.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/family-job-board` — Choremate responsive React web app and Clerk auth screens
- `artifacts/family-job-board-mobile` — Choremate native Expo/React Native iOS client with custom Clerk auth and bearer-token API transport
- `artifacts/api-server/src/routes/family-job-board.ts` — role-aware family, job, review, and points API
- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/db/src/schema/family-job-board.ts` — PostgreSQL schema

## Architecture decisions

- Each family member uses their own Clerk account. A parent creates child profiles, and each child links their account to one unclaimed profile with the family join code.
- Authorization is enforced in API routes from the Clerk user mapping; the client-side role-aware UI is not treated as a security boundary.
- Job Board claims use one conditional database update so only the first child can claim a job.
- Twice-daily shared jobs create two independent runs, and a database constraint prevents one child from claiming both runs.
- Approved points are immutable ledger entries. A unique job constraint prevents duplicate awards.
- The visual identity is teen-focused: high-contrast neutrals with electric cobalt and magenta accents, bold typography, and mature productivity styling rather than a childlike chore-chart aesthetic.

## Product

- Parent family setup and management for up to three child profiles
- Assigned jobs and a shared Job Board
- One or two separately claimable runs of the same job for the current day
- Child claiming, starting, sign-off, and review submission
- Confirmation and completion sounds, with completion sent directly to the parent review queue
- Parent approval, change requests, rejection, and initiative bonuses
- Assigned, voluntary, and bonus contribution tracking
- Responsive Today, Board, Review, Contributions, and Family navigation

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run API code generation after every OpenAPI change.
- Clerk browser API calls use session cookies; do not add bearer-token handling to the web app.
- The Expo client supplies Clerk bearer tokens through `@workspace/api-client-react`; preserve the web app's existing cookie-session behavior.
- Build and publish the native client from replit.com rather than the iOS Replit app.
- `EXPO_PUBLIC_DOMAIN` is workflow-injected for the native API base URL; never hardcode a development or production hostname.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
