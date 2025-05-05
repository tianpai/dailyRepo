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

## 📋 TODO

- [x] design, implement and test API for top trending only
- [x] scheduler.js will be the entry for scheduled jobs
  - Scrapping is decoupled from REST API and runs as a separate node process
- [x] implement and test caching (node-cache)
      switch from `node-cache` to _Redis_ if horizontal scale is needed
  - utils/nodeCahce.js
  - job/RepoScrapeJob.js
- [ ] Filter by Category or tags
- [ ] generate repo summary
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
- [ ] React frontend
  - [ ] graph a trending history of a repo
- [ ] graph for a repo
- [ ] AWS?
