import mongoose, { Schema } from "mongoose";

export interface IWeeklyTopicFindings {
  _id?: mongoose.Types.ObjectId;
  year: number;
  week: number;
  languageTopicMap: {
    [language: string]: {
      [cluster: string]: number;
    };
  };
  createdAt: Date;
}

const WeeklyTopicFindingsSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  week: { type: Number, required: true },
  languageTopicMap: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

WeeklyTopicFindingsSchema.index({ year: 1, week: 1 }, { unique: true });
WeeklyTopicFindingsSchema.index({ createdAt: -1 });

const WeeklyTopicFindings = mongoose.model<IWeeklyTopicFindings>(
  "WeeklyTopicFindings",
  WeeklyTopicFindingsSchema,
);

export { WeeklyTopicFindings };