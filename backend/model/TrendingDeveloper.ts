import mongoose from "mongoose";
import { ITrendingDeveloper } from "../types/database";

const TrendingDeveloperSchema = new mongoose.Schema({
  username: { type: String, required: true }, // GitHub username of the developer
  repositoryPath: { type: String, required: true }, // top project path in "owner/name" format
  profileUrl: { type: String, required: true }, // URL to the developer's profile
  avatar_url: { type: String, required: false }, // URL to the developer's avatar
  trendingDate: { type: String, required: true }, // format: YYYY-MM-DD
  location: { type: String, required: false }, // developer's location from GitHub profile
  // mostUsedLang
  // timezone
});

// Index for efficient queries
TrendingDeveloperSchema.index({ trendingDate: -1 });
TrendingDeveloperSchema.index({ username: 1, trendingDate: -1 });

const TrendingDeveloper = mongoose.model<ITrendingDeveloper>(
  "TrendingDeveloper",
  TrendingDeveloperSchema,
);

export { TrendingDeveloper };
