# Backend Endpoints

All endpoints are relative to `/api/v1/`.

## Repositories (`/repos`)

- `GET /repos/trending`
  - Description: Retrieves a list of trending repositories.
  - Query Parameters: `?date=YYYY-MM-DD` (Optional: specific date for trending
    data), `?page=N` (Optional: page number, default 1), `?limit=N` (Optional:
    items per page, default 15)
- `GET /repos/search`
  - Description: Search repositories by name, owner, or topics with optional language filtering.
  - Query Parameters: 
    - `?q=search terms` (Required: search query, supports multiple terms)
    - `?language=JavaScript` (Optional: filter by programming language)
    - `?page=N` (Optional: page number, default 1)
    - `?limit=N` (Optional: items per page, default 15, max 50)
  - Example: `/repos/search?q=react video-editor&language=TypeScript`
- `POST /repos/star-history`
  - Description: Retrieves star history for a list of repositories.
  - Request Body: `{ repoNames: string[] }` (Array of repository names in
    format "owner/repo")
- `GET /repos/:owner/:repo/star-history`
  - Description: Retrieves all star history for a specific repository.
  - Path Parameters: `:owner`, `:repo`
- `GET /repos/keywords`
  - Description: Retrieves trending keywords analysis for repositories.
  - Query Parameters: `?date=YYYY-MM-DD` (Optional: get keywords for specific date, must be within past 7 days)
  - Caching: 7-day cache for historical data, 12-hour cache for current data
  - Example: `/repos/keywords?date=2025-08-13`
- `GET /repos/topics-by-language`
  - Description: Retrieves topics grouped by programming language.

## Developers (`/developers`)

- `GET /developers/`
  - Description: Retrieves a list of all developers.
- `GET /developers/trending`
  - Description: Fetches a list of developers who are currently trending.
  - Query Parameters: `?date=YYYY-MM-DD` (Optional: specific date for trending
    developer data), `?page=N` (Optional: page number), `?limit=N` (Optional:
    items per page)

## Languages (`/languages`)

- `GET /languages/`
  - Description: Retrieves a list of all supported programming languages.
- `GET /languages/:language/trending`
  - Description: Fetches trending repositories or projects for a specific
    programming language.
  - Path Parameters: `:language`
  - Query Parameters: `?date=YYYY-MM-DD` (Optional: specific date for trending
    data)
- `GET /languages/language-list`
  - Description: Retrieves top programming languages with usage statistics.
  - Query Parameters: `?top=N` (Optional: number of top languages to return,
    default 5, max 15)
