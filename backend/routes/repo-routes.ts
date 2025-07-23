import { Router } from "express";
import {
  getTrending,
  getStarHistory,
  getStarHistoryAllDataPointTrendingData,
  getStarHistoryForRepos,
} from "../controller/repo-controller";
import {
  getTrendingkeywords,
  getTopicByLanguage,
} from "../controller/keyword-controller";

const repoRouter = Router();

// relative to: /api/v1/repos/
repoRouter.get("/trending", getTrending); // ?date=YYYY-MM-DD
repoRouter.post("/star-history", getStarHistoryForRepos);
repoRouter.get("/star-history", getStarHistoryAllDataPointTrendingData);
repoRouter.get("/:owner/:repo/star-history", getStarHistory); // all star history for a repo
repoRouter.get("/keywords", getTrendingkeywords);
repoRouter.get("/topics-by-language", getTopicByLanguage);

export default repoRouter;
