# Backend Endpoints

All endpoints are relative to `/api/v1/`.

## Repositories (`/repos`)

- `GET /repos/trending`
  - Description: Retrieves a list of trending repositories.
  - Query Parameters: `?date=YYYY-MM-DD` (Optional: specific date for trending data)
- `POST /repos/star-history`
  - Description: Retrieves star history for a list of repositories.
  - Request Body: `[{ owner: string, repo: string }]`
- `GET /repos/star-history`
  - Description: Retrieves all star history data points for trending repositories.
- `GET /repos/:owner/:repo/star-history`
  - Description: Retrieves all star history for a specific repository.
  - Path Parameters: `:owner`, `:repo`
- `GET /repos/ranking`
  - Description: Retrieves a ranking of repositories.
  - Query Parameters: `?top=N` (Optional: number of top repositories to return)

## Developers (`/developers`)

- `GET /developers/`
  - Description: Retrieves a list of all developers.
- `GET /developers/trending`
  - Description: Fetches a list of developers who are currently trending.
  - Query Parameters: `?date=YYYY-MM-DD` (Optional: specific date for trending
    developer data)
- `GET /developers/:username`
  - Description: Retrieves detailed information about a specific developer.
  - Path Parameters: `:username` (e.g., 'octocat')

## Languages (`/languages`)

- `GET /languages/`
  - Description: Retrieves a list of all supported programming languages.
- `GET /languages/:language/trending`
  - Description: Fetches trending repositories or projects for a specific
    programming language.
  - Path Parameters: `:language`
  - Query Parameters: `?date=YYYY-MM-DD` (Optional: specific date for trending data)
