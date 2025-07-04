import { Router } from "express";
import {
  getTrending,
  getStarHistory,
  getRanking,
  getStarHistoryAllDataPointTrendingData,
} from "../controller/repo-controller";

const repoRouter = Router();

// relative to: /api/v1/repos/
repoRouter.get("/trending", getTrending); // ?date=YYYY-MM-DD
repoRouter.get("/star-history", getStarHistoryAllDataPointTrendingData);
repoRouter.get("/:owner/:repo/star-history", getStarHistory); // all star history for a repo
repoRouter.get("/ranking", getRanking); // ?top=N

export default repoRouter;
