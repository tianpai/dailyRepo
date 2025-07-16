import mongoose, { Document } from "mongoose";

// This structure should mirror the 'analyzeKeywordOutput'
// from the ml-keyword-service
export interface IKeywordAnalysis {
  originalTopicsCount: number;
  topKeywords: string[];
  related: { [key: string]: string[] };
  clusterSizes: { [key: string]: number };
}

export interface IKeywords extends Document {
  date: string; // YYYY-MM-DD format
  analysis: IKeywordAnalysis;
}

const KeywordAnalysisSchema = new mongoose.Schema(
  {
    originalTopicsCount: { type: Number, required: true },
    topKeywords: { type: [String], required: true },
    related: { type: Map, of: [String], default: {} },
    clusterSizes: { type: Map, of: Number, default: {} },
  },
  { _id: false },
);

const KeywordsSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  analysis: { type: KeywordAnalysisSchema, required: true },
});

const Keywords = mongoose.model<IKeywords>("Keywords", KeywordsSchema);
export { Keywords };
