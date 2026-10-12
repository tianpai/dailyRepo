# DailyRepo scraper

A standalone pnpm workspace. It collects GitHub trending repositories and
developers, saves dated observations, and exits. It does not start an HTTP
server or analysis jobs.

## Configuration

Create `scraper/.env` from `.env.example` with:

```dotenv
SCRAPER_MONGODB_URI=mongodb://localhost:27017/dailyrepo_dev
GITHUB_TOKEN=your-github-token
```

The connection string must select the new database. The scraper deliberately
requires `SCRAPER_MONGODB_URI` instead of falling back to the old API's `MONGO`
or `MONGODB_URI`. `SCRAPER_MONGODB_URI_FILE` supports a mounted secret file.
`ENV_FILE` can select a different environment file, relative to the scraper
workspace. No real credentials are checked into the repository.

## Commands

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @dailyrepo/scraper... build
pnpm scrape
```

A dry run collects at most three repositories and three developers. It does not
connect to MongoDB, create collections/indexes, or save records:

```sh
pnpm --filter @dailyrepo/scraper scrape:test
```

A dry run still makes GitHub requests. `GITHUB_TOKEN` authorizes API requests;
without it, GitHub's unauthenticated limits apply.

## Storage

The new database uses:

- `repos`: one complete repository observation per `(fullName, date)`.
- `trendingdevelopers`: one developer observation per `(username, date)`.
- `scrapedays`: repository collection status and coverage for each date.

There is no separate collection of latest repositories or repository snapshots.
Every observation has a UTC `date` in `YYYY-MM-DD` format. One date is captured
at job startup and used for both repositories and developers, including runs
that cross midnight. Repository `createdAt` and `lastUpdate` retain GitHub's
original timestamps; they do not determine the observation date.

For example, two days for the same repository are two documents in `repos`:

```json
[
  {
    "repo_id": 123456,
    "fullName": "owner/repo",
    "date": "2026-10-09",
    "topics": ["computer-vision"],
    "language": { "Python": 100000 }
  },
  {
    "repo_id": 123456,
    "fullName": "owner/repo",
    "date": "2026-10-10",
    "topics": ["computer-vision", "OCR"],
    "language": { "Python": 100000, "JavaScript": 2000 }
  }
]
```

The numeric `repo_id` comes from GitHub's repository API `id` and identifies the
same repository across renames and ownership transfers. MongoDB's `_id`
identifies each dated observation separately. Existing observations are not
backfilled; same-day retries preserve the first saved metadata. Persistence
still uses `(fullName, date)`, while a `(repo_id, date)` index supports querying a
repository's observations across name changes.

The documents also include description, license, and repository timestamps.
Owner and repository name are derived by splitting `fullName` at `/`, and
repository URLs are derived as `https://github.com/{fullName}` instead of stored.
Unique indexes prevent duplicate repository/day and developer/day records.
The scraper waits for those indexes before saving. A same-day rerun
preserves the first successfully saved metadata and can add missing observations.
A later date always uses a different key.

## Failures and retries

Trending pages are retried three times with bounded request timeouts. Successful
pages and repository/developer fetches are retained when other requests fail.
Exhausted page retries and failed metadata fetches make the process exit with
status 1 instead of reporting a successful scrape.

Before repository persistence, `scrapedays.status` becomes `running` and any
previous completion timestamp is cleared. It becomes `complete` only after all
requested repository pages/metadata succeed and persistence finishes. Partial
captures are recorded as `partial`; an empty capture is `failed`. An interrupted
or failed write leaves the day unfinished. The record includes saved repository
count, expected count for the attempt, failed repository names, and failed pages.

This completion describes the requested pages and fetched identities for that
attempt. It is not a guarantee that GitHub exposed every trending repository.
Developer collection failures also fail the overall job, but do not invalidate a
completed repository capture. Retrying a run collects GitHub's current daily
pages; it cannot recover an earlier page that is no longer available.

## GitHub Actions

The workflow retains the daily 15:20 UTC schedule and Atlas IP allowlisting.
It requires the new repository secret `SCRAPER_MONGODB_URI`, uses GitHub's runner
token, and serializes runs. It fails before allowlisting when that secret is
missing. The existing Atlas secrets continue controlling network access.

This branch's workflow is not activated by local edits. Scheduled workflows run
from the default branch. The production workflow/database remain unchanged until
an explicit rollout.

## Analysis and existing data

The dated observations retain the topics and languages needed for later daily
and weekly calculations. The existing API and analysis workspaces still use the
previous schema; adapting their readers is separate work. No analysis starts as
part of scraping. Do not run the existing scheduler against the new database.

There is no legacy-data import in this change. Historical appearance dates alone
cannot recover topics or languages that were overwritten in the old database.
