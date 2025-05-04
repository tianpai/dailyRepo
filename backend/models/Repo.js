import mongoose, { Schema } from "mongoose";

const RepoSchema = new mongoose.Schema({
  name: String,
  fullName: String,
  description: String,
  url: String,
  language: Schema.Types.Mixed,
  topics: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  createdAt: Number,
  lastUpdate: Number,
  forks: { type: Map, of: Number },
  stars: { type: Map, of: Number },
  age: Number,
  owner: String,
  stats: {
    trends: Number,
    category: [String],
    scrapedDate: String,
    message: String,
  },
});

const Repo = mongoose.model("Repo", RepoSchema);
export default Repo;
