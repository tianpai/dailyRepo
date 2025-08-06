import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import apiRouterV1 from "./routes/main-routes";
// import compression from "compression";
import helmet from "helmet";
import { connectToDatabase } from "./services/db-connection";

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);
const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 min
  max: 100, // limit each IP
  message: "Too many requests, try again later.",
  skip: (req) => {
    const whitelist = [process.env.WHITELIST_IP];
    return whitelist.includes(req.ip);
  },
});

await connectToDatabase();
app.use(express.json());
app.use(helmet());
// app.use(compression()); // Disabled: Brotli not supported on Render

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://daily-repo.vercel.app",
      "https://dailyrepo.tianpai.io",
      "https://www.dailyrepo.tianpai.io",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok" });
});

if (process.argv.includes("--debug")) {
  app.use((req, _res, next) => {
    const logParts = [`${req.method} ${req.path}`];

    if (Object.keys(req.params).length > 0) {
      logParts.push(`params: ${JSON.stringify(req.params)}`);
    }

    if (Object.keys(req.query).length > 0) {
      logParts.push(`query: ${JSON.stringify(req.query)}`);
    }

    console.log(logParts.join(" "));

    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`   body: ${JSON.stringify(req.body)}`);
    }

    next();
  });
  console.log("Debug mode enabled");
} else {
  // Trust Vercel's proxy, ensure rate limiting to work correctly
  app.set("trust proxy", 1);
  app.use(limiter);
}

app.use(apiRouterV1);

const server = app.listen(port, "::", () => {
  console.log(`Server is running on ${port}`);
});

/* Graceful shutdown */
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(async () => {
    console.log("Server closed", Date.now());
    process.exit(0);
  });
});
