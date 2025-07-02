import { Router } from "express";
import {
  getDevelopersList,
  getTrendingDevelopers,
  getDeveloperDetails,
} from "../controller/developer-controller";

const devRouter = Router();

// Relative to: /api/v1/developers/

// GET /
// Description: Retrieves a list of all developers.
devRouter.get("/", getDevelopersList);

// GET /trending
// Description: Fetches a list of developers who are currently trending.
// Query Parameters: ?date=YYYY-MM-DD (Optional: specific date for trending developer data)
devRouter.get("/trending", getTrendingDevelopers);

// GET /:username
// Description: Retrieves detailed information about a specific developer.
// Path Parameters: :username (e.g., 'octocat')
devRouter.get("/:username", getDeveloperDetails);

export default devRouter;
