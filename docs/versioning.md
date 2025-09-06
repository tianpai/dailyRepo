# API Versioning and Decorator Migration

This project now exposes two API versions side‑by‑side:

- v1 base: `/api/v1` — legacy controllers (functions with Express `req/res`)
- v2 base: `/api/v2` — decorator‑based controllers (schema‑validated, cached)

The goal is zero breaking changes for consumers: response shapes are preserved.
v2 simplifies server code and centralizes cross‑cutting concerns.

## What’s Migrated in v2

Controllers registered under `/api/v2` using class decorators:

- Repositories: `/api/v2/repos/...`
- Developers: `/api/v2/developers/...`
- Languages: `/api/v2/languages/...`
- Keywords/Topics: `/api/v2/repos/keywords`, `/api/v2/repos/topics-by-language`
- Star History: `/api/v2/repos/:owner/:repo/star-history`, `/api/v2/repos/star-history`

Minor route name difference (Languages):

- v1: `GET /languages/language-list`
- v2: `GET /languages/top` (same data/params, new path)

## How v2 Works (Quick Tour)

- `@Controller('/base')` — class‑level base path
- `@Get('/path')` (+ `@Post`, `@Put`, `@Delete`) — method routes
- `@Schema({ query, params, body })` — Zod schemas for validation and coercion
- `@Cache('key-pattern', ttlSeconds, condition?)` — server‑side caching with optional skip logic

Request handling in v2:

- Parse/validate/coerce via Zod (`@Schema`) → one typed params object for the method.
- Build cache key by interpolating `{tokens}` from parsed params (falls back to raw req where needed).
- If cached → return cached; else call business method, evaluate `condition`, store if allowed.
- Wrap response in the standard API envelope with `makeSuccess/makeError`. If your method returned `_dateOverride`, it becomes the envelope `date`.

## Caching Policy

- Server‑side cache is the source of truth.
- Use `@Cache(..., condition)` to skip caching empty responses (e.g., `repos.length > 0`).
- Avoid payload‑dependent HTTP headers. Keep client caching headers uniform (e.g., default `no-store`), and rely on server TTL.

## Parity Notes

- Response shapes are unchanged from v1 — controllers return plain business data; decorators produce the envelope.
- Star history (single): v2 returns an array (not an object with numeric keys) and strips `_id`. v1 already treated it as an array — v2 makes that explicit.
- Keywords: v2 normalizes the service output to ensure consistent shape (`originalTopicsCount`, `topKeywords`, optional `related`, `clusterSizes`).

## Postman / curl Examples (Local)

Base URL (local): `http://localhost:6969`

- Trending repos (v2):
  - `GET /api/v2/repos/trending?date=YYYY-MM-DD&page=1&limit=15`
- Search repos (v2):
  - `GET /api/v2/repos/search?q=react&page=1&limit=5`
- Star history (single):
  - `GET /api/v2/repos/facebook/react/star-history`
- Star history (bulk):
  - `POST /api/v2/repos/star-history` body `{ "repoNames": ["facebook/react","vercel/next.js"] }`
- Developers (trending):
  - `GET /api/v2/developers/trending?date=YYYY-MM-DD&page=1&limit=20`
- Languages (top):
  - v2 `GET /api/v2/languages/top?top=10` (v1 equivalent: `/languages/language-list?top=10`)
- Keywords:
  - `GET /api/v2/repos/keywords?date=YYYY-MM-DD&includeRelated=true`
- Topics by language:
  - `GET /api/v2/repos/topics-by-language`

## Adding a New v2 Controller

1. Create a class and annotate it:

```ts
@Controller("/things")
export class ThingController {
  @Get("/")
  @Schema({ query: z.object({ page: z.coerce.number().min(1).default(1) }) })
  @Cache("things-{page}", 3600)
  async list({ page }: { page: number }) {
    const items = await service.fetch(page);
    return { items };
  }
}
```

2. Register it in `backend/routes/main-routes-v2.ts`:

```ts
return createRouterFromControllers("/api/v2", [
  RepoController,
  StarHistoryController,
  DeveloperController,
  LanguageController,
  KeywordController,
  ThingController, // new
]);
```

## Dev Tips

- You can omit `@Param` and `@Query` in v2: cache keys read parsed params first and fall back gracefully.
- Prefer schema defaults for stable cache keys (e.g., default `page/limit`).
- Use `_dateOverride` in the business return to control the envelope’s `date`.
- Aliases: use `@version2/*` for v2 controllers and `@decorators/http-decorators` for decorators.

## Migration Status

- v2 live: Repos, Star History, Developers, Languages, Keywords.
- v1 remains mounted under `/api/v1` for comparison and fallback.
- Future work (optional): per‑route headers decorator, typed error classes, OpenAPI generation from Zod schemas.
