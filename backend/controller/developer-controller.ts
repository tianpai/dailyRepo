import { Request, Response, NextFunction } from "express";

/**
 * GET /developers
 * Returns a list of all developers
 * Parameters: None
 *
 * pagination or general filtering in the future
 */
export async function getDevelopersList(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  // query parameters for pagination or filtering can be added here in the future
  res.status(200).json({ developers: [] });
  return;
}

/**
 * GET /developers/trending
 * Returns the list of trending developers, optionally filtered by date.
 *
 * Option
 * Retrieves a list of trending developers for a specific date.
 *  ?date=2023-06-15
 */
export async function getTrendingDevelopers(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  // TODO: implement trending-logic
  res.status(200).json({ trending: [] });
  return;
}

/**
 * GET /developers/:username
 * Returns detailed information for a single developer.
 */
export async function getDeveloperDetails(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  // TODO: fetch developer by username
  res.status(200).json({ developer: null });
  return;
}
