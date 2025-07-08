# DailyRepo

![License](https://img.shields.io/github/license/tianpai/dailyRepo)
![Bun](https://img.shields.io/badge/Bun-1.2.17+-green?logo=Bun)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Code Size](https://img.shields.io/github/languages/code-size/tianpai/dailyRepo)

## 📝 Introduction

DailyRepo helps developers and teams stay up-to-date with the latest and
all-time trending GitHub projects. Choose from curated categories—like Linux
utilities, AI/ML libraries, web-dev tools, productivity apps, and more—or drill
into historical trends and interactive graphs. Whether you’re scouting for
inspiration, benchmarking your own projects against the community, or simply
browsing what’s hot today, DailyRepo delivers fresh, reliable insights in an
intuitive UI.

---

## 🚀 Features Overview

### 1. Multi-Category Trending

- **linux-tool:** Native Linux utilities and sysadmin tools
- **cli:** Command-line applications
- **productivity:** Workflow helpers, note-taking, time tracking
- **web-dev:** Frontend, backend, and developer tooling
- **ai-ml:** AI/ML libraries, frameworks, and notebooks
- **trending:** General GitHub trending across all types
- **security:** Pen-testing, scanning, and auditing tools
- **misc:** Niche or unclassified repositories
- **Trending Developers:** Track popular developers by language and repository contributions
- Default view shows **Trending**; filter by any category to narrow down results.

### 2. Powerful Scraping & Caching

- Decoupled scraping service runs on a schedule (via GitHub Actions or local
  scheduler).
- **Intelligent Rate Limiting**: Batched processing respects GitHub API limits
  (4000 requests/hour) with dynamic rate checking.
- **Smart Processing**: Large repository sets are split into batches of ~100
  repositories with automatic retry logic.
- Pluggable cache layer (in-memory with `node-cache`) for high performance and
  horizontal scalability.
- Extensible scoring engine merges GitHub’s metrics (stars, forks, watches)
  with custom weighting.

### 3. Intuitive, Interactive Frontend

- Built with **Vite**, **React** + **TypeScript**, styled with **Tailwind CSS**.
- Dynamic charts (star history, category comparisons) and pie charts for
  language composition.
- Light/dark mode toggle, hover animations, and a day-picker for historical views.
- Search and filtering by tags, topics, and repository name.

### 4. Deployment & DevOps

- Dockerized backend with multi-stage builds and non-root user for production readiness.
- Automated job scheduling via GitHub Actions; MongoDB Atlas integration for
  cloud storage.
- `.env` support.

---

## 🔧 Run locally

### Backend (Bun/TypeScript)

```bash
cd backend
bun run dev              # Start development server
```

### Frontend (React/TypeScript)

```bash
cd frontend
npm run dev              # Start development server
```

More commands available in [dev-build-cmd.md](docs/dev-build-cmd.md).

## 🎯 Key Features

### Trending Developers

- Track popular developers alongside repositories
- Language-specific developer rankings
- Integration with repository popularity metrics

### Rate Limiting Strategy

- Dynamic rate limiting checks actual GitHub API status
- Intelligent 403 error handling with automatic retries
- Conservative 4000 requests/hour limit for reliability
- Batched processing for large datasets (150+ repositories)
