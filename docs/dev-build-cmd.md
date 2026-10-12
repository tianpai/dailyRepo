# Development Commands

Use pnpm 12.4.2 and Node 22.20 or newer within Node 22. Run these commands
from the repository root; pnpm selects the workspace under `apps/`.

## Backend (NestJS/TypeScript)

```bash
pnpm install --frozen-lockfile
pnpm --filter @dailyrepo/api... build
pnpm dev:api
pnpm --filter @dailyrepo/api test --runInBand
```

## Frontend (React/TypeScript)

```bash
pnpm dev:web
pnpm --filter @dailyrepo/web build
pnpm --filter @dailyrepo/web lint
pnpm --filter @dailyrepo/web preview
```

## Scraper

```bash
pnpm build:scraper
pnpm scrape
pnpm --filter @dailyrepo/scraper scrape:test
```

Local scraper configuration lives in `apps/scraper/.env`. The dry run does not
connect to MongoDB or save observations. See [scraper operations](../apps/scraper/README.md).

## Analysis jobs

```bash
pnpm --filter @dailyrepo/jobs... build
pnpm jobs:daily --help
pnpm jobs:weekly --help
```

The analysis workspace still reads the previous database schema. See
[operations](../OPERATIONS.md) before running calculations or its scheduler.

## All workspaces

```bash
pnpm build
pnpm test
```
