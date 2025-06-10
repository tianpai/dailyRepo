import mongoose, { Schema } from "mongoose";

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
  age: Number,
  license: String,
  trendingDate: String,
});

const Repo = mongoose.model("Repo", RepoSchema);
export default Repo;
