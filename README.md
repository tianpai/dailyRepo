# DailyRepo

![License](https://img.shields.io/github/license/tianpai/dailyRepo)
![Bun](https://img.shields.io/badge/Bun-1.2.17+-green?logo=Bun)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Code Size](https://img.shields.io/github/languages/code-size/tianpai/dailyRepo)

A unified platform to discover, track, and visualize GitHub’s most popular
repositories across various categories.

DailyRepo consists of a Node.js backend that scrapes and serves trending data,
and a React/TypeScript frontend that provides an interactive dashboard for
exploring repositories by category, date, and popularity metrics.

---

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
- Default view shows **Trending**; filter by any category to narrow down results.

### 2. Powerful Scraping & Caching

- Decoupled scraping service runs on a schedule (via GitHub Actions or local scheduler).
- Pluggable cache layer (in-memory with `node-cache`, Redis-ready) for high performance and horizontal scalability.
- Extensible scoring engine merges GitHub’s metrics (stars, forks, watches) with custom weighting.

### 3. Intuitive, Interactive Frontend

- Built with **Vite**, **React** + **TypeScript**, styled with **Tailwind CSS**.
- Dynamic charts (star history, category comparisons) and pie charts for language composition.
- Light/dark mode toggle, hover animations, and a day-picker for historical views.
- Search and filtering by tags, topics, and repository name.

### 4. Deployment & DevOps

- Dockerized backend with multi-stage builds and non-root user for production readiness.
- Automated job scheduling via GitHub Actions; MongoDB Atlas integration for cloud storage.
- Environment-driven configuration with `.env` support.

---

## 📋 Professional Roadmap & Todos

### ✅ Completed

**Backend Infrastructure:**

- [x] Design, implement and test API for top trending repositories
- [x] Scheduler.js implementation for decoupled scraping jobs
- [x] Caching system with node-cache (Redis-ready for horizontal scaling)
- [x] Repo-star project integration for accurate trending scores
- [x] API redesign for improved performance
- [x] Docker containerization with multi-stage builds
- [x] Production-ready deployment with non-root user
- [x] GitHub Actions scheduled job implementation
- [x] MongoDB Atlas Admin API integration for IP whitelisting

**Frontend Foundation:**

- [x] Initial setup with Vite + React + TypeScript
- [x] Tailwind CSS integration
- [x] Repository display system (name, GitHub link, stars, forks, watches)
- [x] Latest trending repositories list display
- [x] Toggle light/dark mode functionality
- [x] Display repository language composition in pie charts
- [x] Display repository tags and topics (max 5, randomized)
- [x] Interactive graphs for trending repository data

### Near-Term

- [ ] Expand repository details view (description, license, last updated)
- [x] Expand scrapping range to include language-specific repositories and developers
- [ ] Finalize category filtering in UI (backend categorization system is ready)
- [ ] Implement repository topics and tag cloud for richer filtering
- [ ] Add hover animations and visual enhancements
- [x] Day picker for historical data selection
- [ ] Repository search functionality
- [ ] Monthly trending top 10 and hottest topics
- [ ] Exportable reports and visualizations (PDF/CSV) of trending graphs

### Mid-Term

- [ ] Dynamic background changes based on mouse hover
- [ ] Integrate React Router & TanStack React Query for improved SPA navigation
- [ ] Enhance caching layer: swap in Redis and add TTL tuning
- [ ] Comprehensive end-to-end and load testing
- [ ] Build account system: user registration, favorites, and personalized comparisons
- [ ] CI/CD pipeline with linting, testing, and vulnerability scanning

### Long-Term

- [ ] Build better animations and visualizations for repository cards and graphs
- [ ] Machine-learning–driven recommendations: suggest repos based on user behavior
- [ ] Plugin system: allow community contributions of new scraping modules
- [ ] Mobile-optimized PWA with offline caching
- [ ] Internationalization (i18n) and localization (L10n)

---

_Last updated: 2025-06-28_
