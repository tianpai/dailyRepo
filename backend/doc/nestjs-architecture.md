# NestJS Architecture

## Project Structure

```txt
src/
├── app.module.ts              # Root module (imports DatabaseModule, feature modules)
├── main.ts                    # Bootstrap API server
├── database/                  # Shared database module
│   ├── database.module.ts     # MongooseModule.forRoot() + forFeature(all schemas)
│   ├── schemas/
│   │   ├── repo.schema.ts
│   │   ├── star-history.schema.ts
│   │   ├── developer.schema.ts
│   │   ├── keywords.schema.ts
│   │   └── weekly-topics.schema.ts
│   └── index.ts               # Export all schemas for easy import
├── common/
│   ├── interceptors/
│   │   └── response.interceptor.ts    # Wrap responses in ApiSuccess format
│   ├── filters/
│   │   └── http-exception.filter.ts   # Format errors as ApiError
│   └── pipes/
│       └── zod-validation.pipe.ts     # Zod validation
├── repos/                     # Repository feature module
│   ├── repos.module.ts        # Import DatabaseModule
│   ├── controllers/
│   │   ├── repos.controller.ts        # /repos/trending, /search, /time-to-300-stars
│   │   ├── star-history.controller.ts # /repos/:owner/:repo/star-history, POST /repos/star-history
│   │   └── keywords.controller.ts     # /repos/keywords, /topics-by-language
│   └── services/
│       ├── repos.service.ts
│       ├── star-history.service.ts
│       └── keyword.service.ts
├── developers/                # Developers feature module
│   ├── developers.module.ts   # Import DatabaseModule
│   ├── controllers/
│   │   └── developers.controller.ts   # /developers, /developers/trending, /developers/top
│   └── services/
│       └── developers.service.ts
├── languages/                 # Languages feature module
│   ├── languages.module.ts    # Import DatabaseModule
│   ├── controllers/
│   │   └── languages.controller.ts    # /languages, /languages/top, /languages/trending
│   └── services/
│       └── languages.service.ts
└── scraper/                   # Scraper module (CLI or scheduled task)
    ├── scraper.module.ts      # Import DatabaseModule
    ├── scraper.service.ts     # Main orchestrator
    ├── services/
    │   ├── repo-scraper.service.ts
    │   ├── developer-scraper.service.ts
    │   └── star-history-scraper.service.ts
    └── main.ts                # Standalone CLI entry (bun run scrape:batched)
```

## Current API Routes (v2)

### Repos (`/api/v2/repos`)

- `GET /api/v2/repos/trending` - Trending repositories (query: date, page, limit)
- `GET /api/v2/repos/search` - Search repos (query: q, language, page, limit)
- `GET /api/v2/repos/time-to-300-stars` - Time analysis (query: age, sort)
- `GET /api/v2/repos/:owner/:repo/star-history` - Single repo star history
- `POST /api/v2/repos/star-history` - Bulk star history (body: repoNames[])
- `GET /api/v2/repos/keywords` - Trending keywords (query: date, includeRelated)
- `GET /api/v2/repos/topics-by-language` - Topics grouped by language

### Developers (`/api/v2/developers`)

- `GET /api/v2/developers/` - List developers (empty placeholder)
- `GET /api/v2/developers/trending` - Trending developers (query: date, page, limit)
- `GET /api/v2/developers/top` - Top trending developers (query: limit)

### Languages (`/api/v2/languages`)

- `GET /api/v2/languages/` - Supported languages list
- `GET /api/v2/languages/trending` - Trending by language (placeholder)
- `GET /api/v2/languages/top` - Top languages by usage (query: top)

## Database Schemas

### Repo Schema

- **Collection**: `repos`
- **Fields**: fullName, owner, name, description, url, language, topics, createdAt, lastUpdate, license, trendingDate, trendingRecord
- **Usage**: Repository data, queried by repos and languages modules

### StarHistory Schema

- **Collection**: `starhistories`
- **Fields**: repoId (ref to Repo), saveDate, history (array of {date, count})
- **Indexes**: repoId + saveDate, history.date
- **Usage**: Star history tracking

### TrendingDeveloper Schema

- **Collection**: `trendingdevelopers`
- **Fields**: username, repositoryPath, profileUrl, avatar_url, location, trendingRecord
- **Indexes**: trendingRecord, username + trendingRecord
- **Usage**: Developer trending data

### Keywords Schema

- **Collection**: `keywords`
- **Fields**: date (YYYY-MM-DD), analysis (originalTopicsCount, topKeywords, related, clusterSizes)
- **Usage**: Daily keyword analysis

### WeeklyTopicFindings Schema

- **Collection**: `weeklytopicfindings`
- **Fields**: year, week, languageTopicMap, createdAt
- **Indexes**: year + week (unique), createdAt
- **Usage**: Language-topic relationships

## NestJS Feature Replacements

### Custom Decorators → NestJS Built-ins

- `@Cache()` → `@CacheKey()` + `@CacheTTL()` + `CacheModule`
- `@Schema()` → `ValidationPipe` with Zod or `class-validator`
- `@Controller()` → Native `@Controller()`
- `@Get/@Post()` → Native `@Get()/@Post()`

### Response Wrapping

- Use `ResponseInterceptor` globally to wrap all responses in `ApiSuccess<T>`
- Use `HttpExceptionFilter` to format errors as `ApiError`

### Caching Strategy

- NestJS `CacheModule` with Redis or in-memory store
- Use `CacheInterceptor` or manual `cacheManager.get/set()` in services
- Consider conditional caching logic in services instead of decorator

### Validation

- Use NestJS `ValidationPipe` with DTOs
- Option 1: Keep Zod schemas, create custom `ZodValidationPipe`
- Option 2: Migrate to `class-validator` + `class-transformer` (more NestJS-native)

## Module Design

### DatabaseModule (Global)

- Shared module exporting all Mongoose models
- Imported by: repos, developers, languages, scraper modules
- Single source of truth for schemas
- Configuration: MongooseModule.forRoot() with connection string

### Feature Modules (repos, developers, languages)

- Import DatabaseModule to access schemas
- Controllers handle HTTP requests
- Services contain business logic
- Use dependency injection for models and other services

### Scraper Module

Three implementation options:

1. **NestJS Command** (recommended): Use `nest-commander` package for CLI commands
2. **Standalone Script**: Bootstrap minimal NestJS app context, run scraper, exit
3. **Scheduled Task**: Use `@nestjs/schedule` for cron jobs

## Migration Path

```txt
1. Database Module (1-2 days)
   ├── Create src/database/database.module.ts
   ├── Convert legacy/model/Repo.ts → schemas/repo.schema.ts
   ├── Convert legacy/model/StarHistory.ts → schemas/star-history.schema.ts
   ├── Convert legacy/model/TrendingDeveloper.ts → schemas/developer.schema.ts
   ├── Convert legacy/model/Keywords.ts → schemas/keywords.schema.ts
   └── Convert legacy/model/WeeklyTopicFindings.ts → schemas/weekly-topics.schema.ts

2. Common Module (1 day)
   ├── Create response.interceptor.ts (ApiSuccess wrapper)
   ├── Create http-exception.filter.ts (ApiError formatter)
   └── Create zod-validation.pipe.ts (or use class-validator)

3. Services (3-4 days)
   ├── repos.service.ts (fetchTrendingRepos, fetchSearchedRepos)
   ├── star-history.service.ts (fetchRepoStarHistory, fetchMultiple)
   ├── developers.service.ts (fetchTrendingDevelopers, fetchTop)
   ├── languages.service.ts (language aggregations)
   └── keyword.service.ts (fetchKeywordAnalysis)

4. Controllers (2-3 days)
   ├── repos.controller.ts
   ├── star-history.controller.ts
   ├── developers.controller.ts
   ├── languages.controller.ts
   └── keywords.controller.ts

5. Scraper (2-3 days)
   ├── scraper.module.ts
   ├── scraper.service.ts (orchestrator)
   ├── repo-scraper.service.ts
   ├── developer-scraper.service.ts
   └── star-history-scraper.service.ts
```

## Benefits

- **Shared Schemas**: All modules access same schemas via DI
- **No Circular Dependencies**: DatabaseModule is at the root
- **Reusability**: Scraper can reuse service logic from API modules
- **Testability**: Easy to mock dependencies
- **Maintainability**: Standard NestJS patterns
- **Type Safety**: TypeScript + Mongoose decorators
