# 📋 Todos

## ✅ Completed

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
- [x] Integrate React Router & Vite code splitting for improved SPA navigation
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
