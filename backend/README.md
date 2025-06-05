# 📦 DailyRepo

## 🗃️ Categories

| Categories   | Description                                |
| ------------ | ------------------------------------------ |
| linux-tool   | Native Linux utilities, sysadmin tools     |
| cli          | Command-line apps                          |
| productivity | Workflow, time tracking, note-taking tools |
| web-dev      | Frontend/backend/devtools for web          |
| ai-ml        | AI/ML libraries and tools                  |
| trending     | GitHub trending (general, no strict type)  |
| security     | Hacking, scanning, auditing, pentesting    |
| misc         | Unclassified or niche                      |

User can choose one of the above categories to filter the repositories. The
default category is `trending`. If the user does not choose a category, the app
will show the trending repositories by default.

Each category contains ONE GitHub repository.

## Docker

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

## 📋 TODO

### On-going

### trending scraping

- [x] design, implement and test API for top trending only
- [x] scheduler.js will be the entry for scheduled jobs
  - Scrapping is decoupled from REST API and runs as a separate node process
- [x] implement and test caching (node-cache)
      switch from `node-cache` to _Redis_ if horizontal scale is needed
  - [x] utils/nodeCahce.js
  - [x] job/RepoScrapeJob.js

### Features and APIs

- [ ] Incorporate repo-star project to produce more accurate trending repos
  - [ ] update trending score every cache cycle
- [x] API redesign (branch api-redesign)
- [ ] Filter by Category or tags
  - [ ] a word cloud for tags
- [ ] allow user to search for a repo that might be trending previously

### Improvements

- [ ] tracking & cookies
  - [ ] track most clicked category
  - [ ] track most clicked repo
  - [ ] add visit count to the database
  - [ ] add their IP address to the database and their devices
  - [ ] archive tracking info per IP in 90 days

### Deployment (dev phase)

- [x] schedule job on GitHub Actions
  - [x] use MongoDB Atlas Admin API to add runner's IP address to the white-list
- [x] server.js encapsulates in Docker container
  - [x] multi-stage Dockerfile to reduce image size
  - [x] Only install production only dependencies
  - [x] Create non-root user in Dockerfile
