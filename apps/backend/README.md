# DailyRepo API

This workspace serves the NestJS HTTP API under `/api/v2`. It reads saved keyword
and weekly-topic results; computation and scheduling run in the `jobs` workspace.
It does not require a Hugging Face credential.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm dev:api
```

For production, `pnpm --filter @dailyrepo/api prod` runs the compiled server.
Configure `MONGODB_URI` (or `MONGO`) and optionally `PORT`; the default port is 3000.
Mounted secret files are supported through `MONGODB_URI_FILE` or `MONGO_FILE`.
Local development continues loading `apps/backend/.env`.

See [operations](../../OPERATIONS.md) for collection, analysis commands, local
configuration, and production transition details.
