import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import repoRoutes from "./routes/RepoRoutes.js";
import rateLimit from "express-rate-limit";
import compression from "compression";
import helmet from "helmet";
import { checkFrontendToken } from "./middleware/checkToken.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 10, // limit each IP
  message: "Too many requests, try again later.",
  skip: (req) => {
    const whitelist = [process.env.WHITELIST_IP];
    return whitelist.includes(req.ip);
  },
});

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

app.use(express.json());
app.use(helmet());
app.use(compression());
// Trust Vercel's proxy, ensure rate limiting to work correctly
app.set("trust proxy", true);


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://daily-repo-git-master-tianpais-projects.vercel.app",
      "https://daily-repo-qxubug6ed-tianpais-projects.vercel.app",
      "https://daily-repo.vercel.app",
    ],
    methods: ["GET"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

if (process.argv.includes("--debug")) {
  console.log("Debug mode enabled");
  app.use("/api/v1/repos", repoRoutes);
} else {
  app.use(limiter);
  app.use("/api/v1/repos", checkFrontendToken, repoRoutes);
}

const server = app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

/* Graceful shutdown */
process.on("SIGTERM", () => {
  debug("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    debug("HTTP server closed", Date.now());
  });
});
