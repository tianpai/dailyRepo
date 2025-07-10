import { Router } from "express";
import {
  getTrending,
  getStarHistory,
  getRanking,
  getStarHistoryAllDataPointTrendingData,
  getStarHistoryForRepos,
  getTrendingkeywords,
  getTopLang,
} from "../controller/repo-controller";

const repoRouter = Router();

// relative to: /api/v1/repos/
repoRouter.get("/trending", getTrending); // ?date=YYYY-MM-DD
repoRouter.post("/star-history", getStarHistoryForRepos);
repoRouter.get("/star-history", getStarHistoryAllDataPointTrendingData);
repoRouter.get("/:owner/:repo/star-history", getStarHistory); // all star history for a repo
repoRouter.get("/ranking", getRanking); // ?top=N
repoRouter.get("/keywords", getTrendingkeywords);
repoRouter.get("/language-list", getTopLang); //?top=N

export default repoRouter;
