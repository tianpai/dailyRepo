# ----- bash command to build and run the container ----------------------
# docker build -t dailyrepo-scraper .
# docker run --env-file .env dailyrepo-scraper


# ---- build step -----------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# copy the rest of the code
COPY . .

# default command (cloud platforms can override args)
CMD ["node", "scheduler.js", "--run-now"]
