# Development Commands

## Backend (Bun/TypeScript)

```bash
cd backend
bun run dev              # Start development server
bun run dev:scraper      # Start scheduler in development mode
bun run dev:scraper:batched  # Start batched scheduler (recommended)
bun run scrape:batched   # Run batched scraper job (respects API limits)
bun run scrape:estimate  # Estimate processing time for batching
bun run build            # Compile TypeScript to JavaScript
bun run test             # Run test suite
```

## Frontend (React/TypeScript)

```bash
cd frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run preview          # Preview production build
```
