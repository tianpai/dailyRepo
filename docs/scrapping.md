# Scraping and Scheduling

The scraper (`backend/src/scraper.ts`) is a standalone NestJS application that scrapes trending GitHub repositories and developers, collecting star history data while respecting API rate limits.

**Key Features:**

- **Batched Processing**: Large repository sets (150+ repos) split into batches of ~100 repositories
- **Dynamic Rate Limiting**: Checks actual GitHub API rate limit status between batches
- **Intelligent 403 Handling**: Automatically verifies rate limit status via GitHub API on errors
- **Smart Waiting**: Only waits for rate limit reset when actually needed
- **Automatic Retry**: Failed requests retry with exponential backoff (up to 3 attempts)

## Scraper Architecture

The scraper is a separate NestJS application (built with `nest-cli-scraper.json`) that performs:

1. **Database Connection**: Establishes MongoDB connection
2. **Repository Scraping**: Scrapes trending repository data (minimal API usage)
3. **Developer Scraping**: Scrapes trending developer data (minimal API usage)
4. **Star History (Batched)**: Core batched processing that estimates and collects star history over several hours, respecting GitHub's 5000 requests/hour limit

## Running the Scraper

### Development Mode

```bash
bun run dev:scraper              # Start scraper in watch mode
```

### Production Commands

```bash
bun run build:scraper            # Build scraper application
bun run scrape:batched           # Run production scraper (recommended)
bun run scrape:test              # Test mode without saving to database
```

### Command Line Flags

The scraper requires one of the following flags:

#### `--run-batched` (Production)

**Full scraping with batched processing.**

```bash
bun run scrape:batched
# or: node dist/scraper --run-batched
```

- Processes trending repositories and developers
- Collects star history with batched processing
- Respects GitHub API rate limits (5000 requests/hour)
- Runs for several hours, logging progress
- **Use this for production and scheduled jobs**

#### `--test-no-save` (Testing)

**Test mode without database writes.**

```bash
bun run scrape:test
# or: node dist/scraper --test-no-save
```

- Runs full scraping logic
- Does NOT save to database
- Useful for testing scraper changes without affecting production data

## GitHub Actions Automation

The scraper runs daily via GitHub Actions (`.github/workflows/scrape.yml`):

```yaml
- Build scraper: npm run build:scraper
- Run scraper: npm run scrape:batched
```

**Note**: Workflow uses `npm` instead of `bun` due to Bun compatibility issues on GitHub Actions runners.

Schedule: Runs at 15:20 UTC daily (cron: `"20 15 * * *"`)

## Further Considerations and improvements

### Minor Improvements

1. Update and remove redundant console.log statements that clutter the output.
2. Chalk seems does not work, however, ASCII escape codes are working.

### Performance

The scrapper does the job, but the built-in 1-3 s pause makes it slow and
pricey on the cloud. It currently handles 403 errors and wait for the next rest
windows.

A daily crawl hits 150-160 repos and fires off about 5 500-7 000 GitHub API
calls. The 5 000-per-hour cap isn't the enemy—the hard-coded sleep is.

Plan:

- Read the rate-limit headers and sleep only when we’re close to the edge.
- Push every call into a queue.
- Implement a event loop that drains the queue at _n_ requests per second (_n_
  = max sub rate limit) so we stay within the cap. Keep the order to avoid
  duplicate work.
- Handle 403 errors by checking the rate limit endpoint and adjusting the
  sleep time accordingly. (The existing logic already does this)
- Batch database writes to cut round-trips.
- On startup, check remaining quota and reset time. Time the first burst so it
  finishes just as the window resets. (it would be great if the scrapper can
  modify its next cron job time)
- If we run out of quota, keep polling the limit endpoint (it’s free) and
  resume the moment we can (a bit evil tho).

That should scrap the wasted wait time. (it always "drives at the max speed")
