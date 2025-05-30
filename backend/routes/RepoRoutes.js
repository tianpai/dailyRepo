import { Router } from "express";
import {
  getLatest,
  getHistory,
  getRanking,
} from "../controller/RepoController.js";

const repoRouter = Router();

async function notImplemented(_, res) {
  res.status(501).json({ error: "Not implemented" });
}

/**
 * GET /api/repo/latest
 * Purpose: Get the latest trending repos
 * No query parameters
 *
 * It should return today's if available, otherwise the most recent available
 */
repoRouter.get("/latest", getLatest);

/**
 * GET /api/repo/historical?date=YYYY-MM-DD
 * Purpose: Get trending repos for a specific historical date
 * Query parameter: date (required, in YYYY-MM-DD format)
 */
repoRouter.get("/history", getHistory);

/**
 * GET /api/repo/ranking
 * Purpose: Get the top 10 repos of all time (based on some aggregation)
 * Optional query parameter: top (number, to get top N repos)
 */
repoRouter.get("/ranking", getRanking);

export default repoRouter;
