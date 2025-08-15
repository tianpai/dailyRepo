# Backend

DailyRepo backend built with Bun (occasionally with Node), TypeScript, and Express.js.

## Features

- RESTful API endpoints for repositories, keywords, and analytics
- GitHub API integration with intelligent rate limiting
- ML-powered keyword extraction and analysis
- Historical data tracking with caching
- MongoDB integration with Mongoose ODM
- Automated data collection via GitHub Actions

## API Endpoints

See [endpoints documentation](../docs/endpoints.md) for complete API reference.

## Development

```bash
bun install
bun run dev
```

## Docker Deployment

```bash
# Build image
docker build -t dailyrepo_backend -f Dockerfile.server .

# Run container
docker run -d \
  --name dailyrepo-backend \
  --env-file .env \
  -p 6969:6969 \
  dailyrepo_backend
```

## Environment Variables

```env
GITHUB_TOKEN=your_github_token
PORT=6969
MONGO_WHITELIST_IP=your_ip
ATLAS_PUBLIC_KEY=your_key
ATLAS_PRIVATE_KEY=your_private_key
ATLAS_GROUP_ID=your_group_id
```

## Architecture

- **Express.js** server with TypeScript
- **MongoDB Atlas** for data persistence
- **GitHub API** integration with rate limiting
- **Caching layer** for performance optimization
- **AI and Machine Learning** for keyword extraction and clustering
- **Batch processing** for large datasets

## Documentation

- [API Endpoints](../docs/endpoints.md) - Complete API reference
- [Scraping Implementation](../docs/scrapping.md) - Data collection details
- [Development Commands](../docs/dev-build-cmd.md) - Build and deployment commands
