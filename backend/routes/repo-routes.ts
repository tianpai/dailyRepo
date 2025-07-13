import { Router } from "express";
import {
  getTrending,
  getStarHistory,
  getRanking,
  getStarHistoryAllDataPointTrendingData,
  getStarHistoryForRepos,
} from "../controller/repo-controller";
import { getTrendingkeywords } from "../controller/keyword-controller";

const repoRouter = Router();

// relative to: /api/v1/repos/
repoRouter.get("/trending", getTrending); // ?date=YYYY-MM-DD
repoRouter.post("/star-history", getStarHistoryForRepos);
repoRouter.get("/star-history", getStarHistoryAllDataPointTrendingData);
repoRouter.get("/:owner/:repo/star-history", getStarHistory); // all star history for a repo
repoRouter.get("/ranking", getRanking); // ?top=N
repoRouter.get("/keywords", getTrendingkeywords);

export default repoRouter;
