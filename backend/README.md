# BACKEND

More on [endpoints](../docs/endpoints.md)
More on [scrapping](../docs/scrapping.md)

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

## `.env` variables

```env
GITHUB_TOKEN
PORT
MONGO WHITELIST_IP
ALTAS_PUBIC_KEY
ALTAS_PRIVATE_KEY
ALTAS_GROUP_ID
```

## Troubleshooting

- Ensure all `.env` variables are set
- Check MongoDB and network connectivity
- For Docker issues, try rebuilding with `--no-cache`

## License

MIT

## Contact

For questions or support, open an issue or contact the maintainer.

## 🔗 Related or Similar Projects

repo: star-history
