# DailyRepo

![License](https://img.shields.io/github/license/tianpai/dailyRepo)
![Bun](https://img.shields.io/badge/Bun-1.2.17+-green?logo=Bun)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Code Size](https://img.shields.io/github/languages/code-size/tianpai/dailyRepo)

## Introduction

Track trending GitHub repositories with historical data analysis and interactive visualizations. Features keyword extraction, language analytics, and developer rankings across multiple categories.

---

![screenshot dark](docs/design/current-dark.png)

## Features

### Repository Tracking

- Multi-category trending (linux-tool, cli, productivity, web-dev, ai-ml, security)
- Historical data collection and analysis
- Developer rankings by language and contributions
- Intelligent rate limiting with GitHub API integration

### Data Analytics

- Keyword extraction from trending repositories
- Language popularity analytics
- Topics categorized by programming language

## Development

```bash
# Backend
cd backend
bun run dev

# Frontend
cd frontend
npm run dev
```

## Documentation

1. [Documentation](docs/)
2. [API Versioning (v1 vs v2)](docs/versioning.md)
3. [Backend README](backend/README.md)
4. [Frontend README](frontend/README.md)
