import { Response } from "express";
import { makeSuccess, makeError } from "@interfaces/api";

export function sendSuccess<T>(
  res: Response,
  data: T,
  fromCache = false,
  status = 200,
) {
  const response = makeSuccess(data, new Date().toISOString());
  response.isCached = fromCache;
  res.status(status).json(response);
}

export function sendError(res: Response, message: string, status = 500) {
  res.status(status).json(makeError(new Date().toISOString(), status, message));
}

export function handleControllerError(res: Response, error: unknown) {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  const status =
    message.includes("Invalid") || message.includes("Bad") ? 400 : 500;
  sendError(res, message, status);
}
