# Scraping and Scheduling

This document explains the `backend/scheduler-batched.ts` script, which is
responsible for scraping trending GitHub repositories and developers, and
collecting star history data in a rate-limit-friendly manner. Currently:

- **Batched Processing**: Large repository sets (150+ repos) are split into
  batches of ~100 repositories
- **Dynamic Rate Limiting**: Checks actual GitHub API rate limit status between
  batches instead of fixed delays
- **Intelligent 403 Handling**: Automatically checks actual rate limit status
  via GitHub API on 403 errors
- **Smart Waiting**: Only waits for rate limit reset when actually needed, not
  on fixed schedules
- **Automatic Retry**: Failed requests are retried with exponential backoff (up
  to 3 attempts)

## `backend/scheduler-batched.ts` Overview

This script is designed to handle GitHub API rate limits by processing star
history data in batches over an extended period. It performs the following main
steps:

1. **Connect to Database**: Ensures a connection to the MongoDB database is
   established.
2. **Process Repositories**: Scrapes and saves trending repository data. This
   step consumes minimal API requests.
3. **Process Developers**: Scrapes and saves trending developer data. This
   step also consumes minimal API requests.
4. **Process Star History (Batched)**: This is the core of the batched
   scraping. It estimates the processing time for star history collection and
   then initiates a batched process. Each batch is processed with a delay to
   stay within GitHub's API rate limits (5000 requests/hour).

## Command Line Flags

The `backend/scheduler-batched.ts` script can be run with different
command-line flags to control its behavior:

### `--estimate`

- **Purpose**: This flag allows you to get an estimation of the star history
  processing requirements without actually running the full scraping job.
- **Usage**: `bun run dev:scraper --estimate`
- **Details**: When this flag is used, the script will:
  - Scrape the initial list of trending repositories.
  - Provide an estimate of how many batches will be required and the total
    estimated time to process all star history data.
  - It will also show the current GitHub API rate limit status.
- **Output**: Provides a summary of the estimated processing time and batch information.

### `--run-batched`

- **Purpose**: This flag initiates the full batched scraping job. This is the
  recommended way to run the scraper for production or regular use.
- **Usage**: `bun run dev:scraper --run-batched`
- **Details**: When this flag is used, the script will:
  - Connect to the database.
  - Process trending repositories and developers.
  - Start the batched star history collection. The script will log that the job
    has been initiated, and the star history processing will continue in the
    background over several hours, respecting GitHub API rate limits.
  - It terminates after starting the batched process, allowing it to run
    independently.
- **Output**: Logs the progress of repository and developer processing, and
  indicates that batched star history collection has started. It will also
  provide an estimate of how long the batched processing will take.

### `--run-now`

- **Purpose**: This flag runs the original, non-batched scraping job.
- **Usage**: `bun run dev:scraper --run-now`
- **Details**: This option uses the older, non-batched scraping logic.
- **WARNING**: **Do not use `--run-now` for regular scraping.** This command
  is likely to hit GitHub API rate limits very quickly, especially with a large
  number of repositories, leading to incomplete data collection and potential API
  blocking. It is primarily for testing or specific scenarios where rate limits
  are not a concern or a quick, small scrape is needed. The batched approach
  (`--run-batched`) is designed to prevent rate limit issues.

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
