# 📦 DailyRepo

## Overview

DailyRepo backend powers the data collection, processing, and API services for
the DailyRepo project. It scrapes repository data, manages storage, and exposes
endpoints for the frontend and other consumers.

## Getting Started (Local Development)

1. Clone the repository and navigate to the `backend` folder:
   ```sh
   git clone <repo-url>
   cd backend
   ```
2. Install dependencies:
   ```sh
   bun install
   ```
3. Create a `.env` file (see variables below).
4. Start the server:

   ```sh
   bun server.ts
   ```

   Or for development with auto-reload:

   ```sh
   bun --watch server.ts
   ```

5. **Scheduler/Scraping Commands:**

   ```sh
   # Start scheduler in development mode
   bun run dev:scraper

   # Run scraper job immediately
   bun run scrape
   ```

## Docker setup for DailyRepo Backend

```dockerfile
# build container image
docker build -t dailyrepo_dev_local_v1 -f Dockerfile.server .

# rebuild without cache
docker build --no-cache -t dailyrepo_dev_local_v1 -f Dockerfile.server .

# run container image with
docker run -d \
  --name express-server \
  --env-file .env \
  -p 6969:6969 \
  dailyrepo_dev_local_v1
```

### `.env` variables:

```env
GITHUB_TOKEN
PORT
MONGO
API_TOKEN
WHITELIST_IP
```

## API Documentation

- **GET /api/v1/repos/trending** — Get trending repositories for a specific date (e.g., `?date=YYYY-MM-DD`).
- **GET /api/v1/repos/star-history** — Get star history data for all trending repositories.
- **GET /api/v1/repos/:owner/:repo/star-history** — Get all star history for a specific repository.
- **GET /api/v1/repos/ranking** — Get the top N ranked repositories (e.g., `?top=N`).

## Development & Contribution

- Fork and clone the repo
- Create feature branches for changes
- Use clear commit messages
- Open a pull request for review

## Troubleshooting

- Ensure all `.env` variables are set
- Check MongoDB and network connectivity
- For Docker issues, try rebuilding with `--no-cache`

## License

MIT

## Contact

For questions or support, open an issue or contact the maintainer.

## 🔗 Related

repo: star-history

## Current Development Status

✅ **Completed Features:**

- TrendingDeveloper model schema and database operations
- Primary language helper function for repository classification
- Data processing pipeline with developer scraping
- Automated scheduling and rate-limited GitHub API integration
- Star history collection and storage

⏳ **Pending Tasks:**

- Ensure API endpoints accepting date parameters (example: `GET /api/v1/repos/trending?date=YYYY-MM-DD`)
- API endpoints for developer data (`GET /api/v1/developers?date=YYYY-MM-DD`)
- Language filtering for repositories (`GET /api/v1/repos/trending?language=javascript`)
- Frontend integration for developer profiles and language filters
