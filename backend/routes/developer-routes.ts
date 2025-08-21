import { Router } from "express";
import {
  getDevelopersList,
  getTrendingDevelopers,
  getTopTrendingDevelopers,
} from "@controller/developer-controller";

const devRouter = Router();

// Relative to: /api/v1/developers/

// GET /
// Description: Retrieves a list of all developers.
devRouter.get("/", getDevelopersList);

// GET /trending
// Description: Fetches a list of developers who are currently trending.
// Query Parameters: ?date=YYYY-MM-DD (Optional: specific date for trending developer data)
devRouter.get("/trending", getTrendingDevelopers);

// GET /top
// Description: Fetches top developers by trending frequency
// Query Parameters: ?limit=10 (default: 10, max: 50)
devRouter.get("/top", getTopTrendingDevelopers);

export default devRouter;
