# 📦 DailyRepo

## Overview

DailyRepo backend powers the data collection, processing, and API services for
the DailyRepo project. It scrapes repository data, manages storage, and exposes
endpoints for the frontend and other consumers.

## Getting Started (Local Development)

1. Clone the repository and navigate to the `backend` folder:
    ```sh
    git clone <repo-url>
    cd backend
    ```
2. Install dependencies:
    ```sh
    npm install
    ```
3. Create a `.env` file (see variables below).
4. Start the server:
    ```sh
    node server.js
    ```
    Or for development with auto-reload (if nodemon is installed):
    ```sh
    npx nodemon server.js
    ```

## Docker setup for DailyRepo Backend

```dockerfile
# build container image
docker build -t dailyrepo_dev_local_v1 -f Dockerfile.server .

# rebuild without cache
docker build --no-cache -t dailyrepo_dev_local_v1 -f Dockerfile.server .

# run container image with
docker run -d \
  --name express-server \
  --env-file .env \
  -p 6969:6969 \
  dailyrepo_dev_local_v1
```

### `.env` variables:

```env
GITHUB_TOKEN
PORT
MONGO
API_TOKEN
WHITELIST_IP
```

## API Documentation

-   **GET /api/repos** — List repositories
-   **POST /api/repos** — Add a repository
-   **GET /api/repos/:id** — Get repository details

## Development & Contribution

-   Fork and clone the repo
-   Create feature branches for changes
-   Use clear commit messages
-   Open a pull request for review

## Troubleshooting

-   Ensure all `.env` variables are set
-   Check MongoDB and network connectivity
-   For Docker issues, try rebuilding with `--no-cache`

## License

MIT

## Contact

For questions or support, open an issue or contact the maintainer.

## 🔗 Related

repo: star-history
