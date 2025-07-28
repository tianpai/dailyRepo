# Backend Endpoints

All endpoints are relative to `/api/v1/`.

## Repositories (`/repos`)

- `GET /repos/trending`
  - Description: Retrieves a list of trending repositories.
  - Query Parameters: `?date=YYYY-MM-DD` (Optional: specific date for trending
    data), `?page=N` (Optional: page number, default 1), `?limit=N` (Optional:
    items per page, default 15)
- `POST /repos/star-history`
  - Description: Retrieves star history for a list of repositories.
  - Request Body: `{ repoNames: string[] }` (Array of repository names in
    format "owner/repo")
- `GET /repos/:owner/:repo/star-history`
  - Description: Retrieves all star history for a specific repository.
  - Path Parameters: `:owner`, `:repo`
- `GET /repos/keywords`
  - Description: Retrieves trending keywords analysis for repositories.
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
