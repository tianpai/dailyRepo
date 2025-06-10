import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import repoRoutes from "./routes/RepoRoutes.js";
import { checkFrontendToken } from "./middleware/checkToken.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 30 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many requests, please try again later.",
});

const limiterDev = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 60 requests per windowMs
  message: "Too many requests, please try again later.",
});

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
  app.use("/api/v1/repos", checkFrontendToken, limiter, repoRoutes);
}

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

/* Graceful shutdown */
process.on("SIGTERM", () => {
  debug("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    debug("HTTP server closed", Date.now());
  });
});
