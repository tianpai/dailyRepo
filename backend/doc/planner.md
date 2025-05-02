# dev api

## Backend

- [x] design, implement and test API for top trending only
- [x] scheduler.js will be the entry for scheduled jobs
  - Scrapping is decoupled from REST API and runs as a separate node process
- [x] implement and test caching (node-cache)
  - utils/nodeCahce.js
  - job/RepoScrapeJob.js
- [ ] expand API for top trending by category
  - [ ] add category to the API
  - [ ] add category to the database
  - [ ] add category to the job
  - [ ] add category to the cache
- [ ] tracking & cookies
  - [ ] track most clicked category
  - [ ] track most clicked repo
  - [ ] add visit count to the database
  - [ ] add their IP address to the database and their devices
  - [ ] archive tracking info per IP in 90 days

## Frontend

- [ ] React frontend
- [ ] graph for a repo

## deployment

- [ ] AWS?

## backlog

1. Filter by Category or tags
2. sort by trend score over time
3. graph a trending history of a repo
4. switch from node-cache to Redis if the server needs to scale horizontally
