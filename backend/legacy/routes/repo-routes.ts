import { Router } from "express";
import {
  getTrending,
  searchRepos,
  getTimeToFirstThreeHundredStars,
} from "@/controller/version1/repo-controller";
import {
  getTrendingkeywords,
  getTopicByLanguage,
} from "@/controller/version1/keyword-controller";
import {
  getStarHistory,
  getStarHistoryForRepos,
} from "@/controller/version1/star-history-controller";

const repoRouter = Router();

// relative to: /api/v1/repos/
repoRouter.get("/trending", getTrending); // ?date=YYYY-MM-DD
repoRouter.get("/search", searchRepos); // ?q=search&language=lang&page=1&limit=15
repoRouter.get("/time-to-300-stars", getTimeToFirstThreeHundredStars); // Time to first 300 stars analysis
repoRouter.post("/star-history", getStarHistoryForRepos);
repoRouter.get("/:owner/:repo/star-history", getStarHistory); // all star history for a repo
repoRouter.get("/keywords", getTrendingkeywords);
repoRouter.get("/topics-by-language", getTopicByLanguage);

export default repoRouter;
