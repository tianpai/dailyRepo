# Data collection and analysis

DailyRepo is a pnpm workspace. The frontend and API remain in `frontend/` and
`backend/`; analysis lives in `jobs/`, scraping in `scraper/`, and MongoDB schemas
and connection configuration in `packages/database/`.

The API only reads saved analysis. It does not run the analysis scheduler or call
Hugging Face. Its keyword/topic response cache expires after five minutes, so a
job's database updates become visible without restarting the API.

## Local commands

Use Node 22.20 or newer within the Node 22 series and the pnpm version pinned in
the root package manifest.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm dev:api
pnpm dev:web
```

One-off analysis commands do not start an HTTP server or register scheduled jobs:

```sh
pnpm jobs:daily --date 2026-10-10
pnpm jobs:weekly --week-of 2026-10-05
```

`daily` defaults to today's UTC date. `weekly` defaults to the previous completed
Monday–Sunday UTC week. `--week-of` can name any date inside a completed week;
the command resolves it to that week's Monday and Sunday. Existing analysis is
preserved by default. `--force` explicitly replaces the saved result, after
validating the input capture. Output includes `saved` or `existing` and the target
period; a failed command exits unsuccessfully.

The continuous scheduler uses the same commands internally:

```sh
pnpm jobs:schedule
```

It runs daily at 18:00 UTC and Monday at 19:00 UTC. The Monday job analyzes the
preceding completed week. Keep one scheduler active; scheduled invocations of the
same job do not overlap within that process. A stopped or sleeping local machine
does not execute schedules or automatically catch up. The dated commands can run
missed periods later when their captured inputs are available.

## Configuration and secrets

The API and scraper accept `MONGODB_URI` or the existing `MONGO` variable. Jobs
also need `HUGGING_FACE`. The scraper also needs `GITHUB_TOKEN`; GitHub Actions
continues supplying its existing token and Atlas credentials.

Jobs normally load `jobs/.env`. `ENV_FILE` can select an existing local file
without copying credentials. Paths are relative to the workspace executing the
command, for example:

```sh
ENV_FILE=../backend/.env pnpm jobs:daily --date 2026-10-10
ENV_FILE=../backend/.env pnpm jobs:schedule
```

Runtime environment variables also work. For Compose secrets, `MONGODB_URI_FILE`
(or `MONGO_FILE`) and `HUGGING_FACE_FILE` select mounted files. The file value takes
precedence over its corresponding environment value. Secret files stay outside
Git and Docker images. The templates contain no production credentials.

## Captured inputs and backfills

The existing `repos`, `trendingdevelopers`, `keywords`, and `weeklytopicfindings`
collections remain. Scraping additionally writes:

- `reposnapshots`: topics and language counts keyed by UTC date and repository.
  A rerun preserves the first captured metadata for each repository that day and
  can add repositories that were missing from the earlier attempt.
- `scrapedays`: a completion record with the number of persisted repository
  snapshots. This is written only after snapshot and current-repository saves
  finish. It describes the repositories successfully collected by the scraper;
  it does not establish that every GitHub trending page/request succeeded.

Daily jobs require a completed capture for the requested date. Weekly jobs require
all seven days and use each repository once, with its latest captured metadata
inside that week. The job checks snapshot counts against the completion records.
Missing or inconsistent input prevents analysis writes; a latest scrape is never
stored under an earlier requested date.

New outputs keep the existing document keys and add input provenance. Weekly
outputs also include `periodStart` and `periodEnd`. The storage `year`/`week` keeps
the existing convention, computed consistently from the input week's Monday in
UTC; these keys are not ISO week numbers. Weekly clustering keeps the existing
raw-topic-count fallback when Hugging Face fails or a language has fewer than 20
topics.

Before this change, `trendingRecord` retained appearance dates while topics and
language counts were overwritten on later scrapes. Those dates alone do not
provide exact historical metadata. Existing saved analyses remain usable, but
the new commands refuse to invent missing historical snapshots. Original snapshots
or backups would be needed to reproduce older inputs. Captured inputs make later
calculation possible; changing the inference model or algorithm may still change
the output.

## Keeping production collection running during reconstruction

Local edits do not change the running Railway backend or GitHub's checked-in
workflow. The updated GitHub workflow keeps the existing schedule, credentials,
and temporary Atlas allowlisting; it installs from the root pnpm lockfile and
builds the scraper with its shared database dependency.

When releasing this structure, roll out the scraper capture first while the
existing production analysis continues running. Daily snapshot input is available
after the first successful repository capture. A full Monday–Sunday window is
needed before the new weekly job can compute a missing result. A partial first
week will fail the coverage check.

Enable the new scheduler only once its inputs and runtime are verified, then
disable the old Railway schedules. Deploying the new API by itself removes
scheduled analysis from that service, so the existing production revision must
remain active until the jobs process is ready. Stopping only the website does not affect
collection or the separate analysis process. No production database migration or
backfill is run by building or testing the workspaces.
