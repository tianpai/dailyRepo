import { Router } from "express";
import {
  getTrending,
  getStarHistory,
  getRanking,
  getStarHistoryAllDataPointTrendingData,
} from "../controller/repo-controller.js";

async function notImplemented(_, res) {
  res.status(501).json({ error: "Not implemented" });
}

const router = Router();

router.get("/trending", getTrending); // ?date=YYYY-MM-DD
router.get("/star-history", getStarHistoryAllDataPointTrendingData);
router.get("/:owner/:repo/star-history", getStarHistory); // all star history for a repo
router.get("/ranking", getRanking); // ?top=N

export default router;
