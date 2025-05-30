import { Router } from "express";
import {
  getTrending,
  getStarHistory,
  getRanking,
} from "../controller/RepoController.js";

const repoRouter = Router();

async function notImplemented(_, res) {
  res.status(501).json({ error: "Not implemented" });
}

const router = Router();

router.get("/trending", getTrending); // ?date=YYYY-MM-DD
router.get("/:id/star-history", getStarHistory); // ?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/ranking", getRanking); // ?top=N

export default router;
