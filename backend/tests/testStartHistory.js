// example.js
import { getRepoStarRecords } from "../utils/starHistory.js";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  const repo = "vercel/next.js"; // "owner/name"
  const token = process.env.GITHUB_TOKEN; // optional
  const points = 30; // number of data points
  try {
    const data = await getRepoStarRecords(repo, token, points);
    console.log(data);
    // prints something like:
    // [ { date: "2021-06-01 12:34:56", count: 100 },
    //   ...,
    //   { date: "2025-06-04 21:00:00", count: 12345 } ]
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
