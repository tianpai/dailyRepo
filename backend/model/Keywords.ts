import mongoose from "mongoose";

export interface topKeywords extends Document {
  date: string;
  topKeywords: string[];
}

const KeywordsSchema = new mongoose.Schema({
  date: { type: String, required: true },
  topKeywords: { type: [String], default: [] },
});

const Keywords = mongoose.model<topKeywords>("Repo", KeywordsSchema);
export { Keywords };
