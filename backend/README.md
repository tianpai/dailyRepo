# Backend DailyRepo

## Folder structure

```txt

backend/
├── controller/ ← connects HTTP requests to logic
├── routes/ ← defines paths like /repos or /users
├── services/ ← holds business logic like scraping, database ops, API calls
├── jobs/ ← scheduled tasks, background jobs
├── utils/ ← reusable helpers (formatters, validators)
├── server.js ← entry point (app, middleware, routers)

```

## Categories

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
