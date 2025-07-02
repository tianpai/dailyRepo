import { Request, Response, NextFunction } from "express";

/**
 * Languages currently handled by the scraper.
 * IMPORTANT: Keep this list in sync with scraper capabilities.
 * reference: @see backend/services/repo-scrapping.ts
 *
 * Do not add languages that are not supported by the scraper.
 * Do not MODIFY this list without updating the scraper.
 */
const SUPPORTED_LANGUAGES: string[] = [
  "c++",
  "go",
  "java",
  "javascript",
  "python",
  "rust",
  "typescript",
];
/**
 * GET /languages
 * Lists all available programming languages.
 * Example: GET /languages
 */
export async function getLanguagesList(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json({ languages: SUPPORTED_LANGUAGES });
    return;
  } catch (error) {
    console.error("Error fetching languages:", error);
  }
}

/**
 * GET /languages/:language/trending
 * Retrieves trending repositories for a specific language.
 * Supports optional ?date=YYYY-MM-DD query parameter.
 * Example: GET /languages/javascript/trending?date=2023-06-15
 */
export async function getLanguageTrendingRepos(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  // TODO: implement language-specific trending logic
  res.status(200).json({ trending: [] });
  return;
}
