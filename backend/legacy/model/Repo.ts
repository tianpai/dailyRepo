import mongoose, { Schema } from "mongoose";
import { IRepo, IStarHistory } from "@interfaces/database";

const RepoSchema = new mongoose.Schema({
  fullName: String,
  owner: String,
  name: String,
  description: String,
  url: String,
  language: Schema.Types.Mixed,
  topics: { type: [String], default: [] },
  createdAt: String,
  lastUpdate: String,
  license: String,
  trendingDate: String,
  trendingRecord: { type: [String], default: [] },
});

const StarHistorySchema = new mongoose.Schema({
  repoId: { type: Schema.Types.ObjectId, ref: "Repo", required: true },
  saveDate: { type: Date, default: Date.now },
  history: [
    {
      date: { type: String, required: true },
      count: { type: Number, required: true, min: 0 },
    },
  ],
});
StarHistorySchema.index({ repoId: 1, saveDate: -1 });
StarHistorySchema.index({ "history.date": 1 });

const Repo = mongoose.model<IRepo>("Repo", RepoSchema);
const StarHistory = mongoose.model<IStarHistory>(
  "StarHistory",
  StarHistorySchema,
);
export { Repo, StarHistory };
