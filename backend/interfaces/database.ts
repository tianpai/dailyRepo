import { Document, ObjectId } from "mongoose";

export type LanguageMap = Record<string, number>;

export interface IRepo extends Document {
  _id: string;
  __v: number;
  fullName: string;
  owner: string;
  name: string;
  description: string;
  url: string;
  language: LanguageMap;
  topics: string[];
  createdAt: string;
  lastUpdate: string;
  age: number;
  license: string;
  trendingDate: string;
  trendingRecord: string[];
}

export interface IStarHistoryEntry {
  date: string;
  count: number;
}

export interface IStarHistory extends Document {
  repoId: ObjectId;
  saveDate: Date;
  history: IStarHistoryEntry[];
}

export interface ITrendingDeveloper extends Document {
  username: string;
  repositoryPath: string;
  profileUrl: string;
  trendingDate: string;
  location?: string;
  avatar_url?: string;
}
