import Repo from "../models/Repo.js";

export async function getRepoTopTrending(req, res) {
  try {
    const repos = await Repo.find().sort({ "stats.trends": -1 }).limit(1);
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: "server error" });
  }
}
