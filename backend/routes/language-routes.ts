import { Router } from "express";
import {
  getLanguagesList,
  getLanguageTrendingRepos,
} from "../controller/language-controller";

const languageRouter: Router = Router();

/*
 * relative to: /api/v1/languages/
 */

/**
 * GET /
 *
 * Retrieves a list of all supported programming languages.
 */
languageRouter.get("/", getLanguagesList);

/**
 * GET /:language/trending
 *
 * Fetches trending repositories or projects for a specific programming language.
 * Default: Returns trending data for the most recent period.
 *
 * Optional query param:
 *   ?date=YYYY-MM-DD - Returns trending data for a specific date
 *
 * Example:
 *   GET /languages/javascript/trending?date=2023-10-01
 */
languageRouter.get("/:language/trending", getLanguageTrendingRepos);

export default languageRouter;
