# Data collection and analysis

DailyRepo is a pnpm workspace: `frontend/`, `backend/`, `scraper/`, `jobs/`, and
shared database code under `packages/database/`.

The scraper now uses the dated observation model: one repository document per
repository per UTC day. The API and analysis workspace still use the previous
schema. Analysis is paused for the new database while those readers are adapted.
See [scraper operations](scraper/README.md) for the complete storage and failure
contract.

## Build and local development

Use Node 22.20 or newer within Node 22 and pnpm 12.4.2 as pinned in the root
package manifest. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

The existing API/frontend can still run against their existing configuration:

```sh
PORT=3000 pnpm dev:api
VITE_BASE_URL=http://localhost:3000 VITE_API_V2=/api/v2 PORT=5173 pnpm dev:web
```

The API loads `backend/.env` and uses `MONGODB_URI` or `MONGO`. It reads stored
analysis results and does not launch scheduled calculation.

## New scraper configuration

Set `SCRAPER_MONGODB_URI` to a connection string selecting the new database,
and supply `GITHUB_TOKEN` for GitHub API access. The scraper reads `scraper/.env`
or a file selected by `ENV_FILE`. A mounted `SCRAPER_MONGODB_URI_FILE` takes
precedence over the environment value. No real environment files are tracked.

```sh
pnpm --filter @dailyrepo/scraper... build
pnpm scrape
```

For collection without any MongoDB connection or writes:

```sh
pnpm --filter @dailyrepo/scraper scrape:test
```

The scraper requires its dedicated database setting; the old API database
variables are not used. No database has been created or populated by this change.

## Captured data

In the new database:

- `repos` stores complete dated repository observations with unique
  `(fullName, date)` keys. Latest and historical data are queried from this one
  collection. Later days never replace earlier days.
- `trendingdevelopers` stores dated developer observations keyed by
  `(username, date)`.
- `scrapedays` tracks repository collection status, saved/expected counts,
  failed fetches, and completion time. Failed/partial captures are not marked
  complete. Same-day retries preserve captured metadata and can fill missing
  observations.

The scraper registers only these models. It does not write the old mutable repo
model, `reposnapshots`, keyword outputs, or weekly topic outputs. The shared
package retains the legacy schemas for the API and existing analysis workspace.

## Analysis and backfill

The captured `date`, `fullName`, `topics`, and `language` fields are the inputs
needed by the current daily keyword and weekly topic algorithms. An analysis
reader for the new schema will select dated observations, validate collection
coverage, and calculate explicitly requested dates or completed weeks.

That reader is not part of the scraper change. The existing `jobs` workspace
still expects `reposnapshots`; do not start its scheduler against this new
schema. Preserving inputs now allows dated calculation after analysis is adapted.
The model and calculation configuration also affect the produced results.

Existing saved results and the old database remain intact. No legacy data is
converted automatically. The old `trendingRecord` contains appearance dates,
but does not contain the topics/languages that existed on each older date.

## Production transition

The branch's GitHub workflow retains the daily 15:20 UTC schedule and temporary
Atlas IP allowlisting, installs from the root pnpm lockfile, and builds the
scraper with its database dependency. It requires `SCRAPER_MONGODB_URI` as a new
repository secret. This avoids directing the new model at the old API database.

Local edits do not modify the deployed API, the default branch's workflow, or
any GitHub secrets. The new database and daily workflow need an explicit rollout
and a verified saved capture before the old collector is retired. Scheduled
workflows run only from the default branch.

The website and analysis can be stopped once the new collector is running;
collection does not require either process. A sleeping/stopped local machine
does not execute collection. GitHub schedule delays/failures still need handling;
rerunning collection later cannot reconstruct a missed historical trending page.
