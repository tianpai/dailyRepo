import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
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
app.use(
  cors({
    origin: ["http://localhost:5173", "https://dailyrepo.onrender.com/"],
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
  app.use("/api/v1/repos", checkFrontendToken, repoRoutes);
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
