# Development Commands

**Note**: Use Bun for local development. GitHub Actions uses npm (Bun compatibility issues).

## Backend (NestJS/TypeScript)

```bash
cd backend
bun run dev              # Start NestJS development server with watch mode
bun run dev:scraper      # Start scraper in development mode
bun run build            # Build main application
bun run build:scraper    # Build scraper application
bun run scrape:batched   # Run batched scraper (respects GitHub API limits)
bun run scrape:test      # Test scraper without saving to database
bun run test             # Run test suite
```

## Frontend (React/TypeScript)

```bash
cd frontend
bun run dev              # Start Vite development server
bun run build            # TypeScript compilation + Vite build
bun run lint             # Run ESLint
bun run preview          # Preview production build
```
