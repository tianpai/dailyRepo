import mongoose from "mongoose";
import { IVisitorLog } from "../types/database";

const VisitorLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    required: true,
  },
});

// Index for efficient querying by date and IP
VisitorLogSchema.index({ timestamp: -1 });
VisitorLogSchema.index({ ip: 1 });

const VisitorLog = mongoose.model<IVisitorLog>("VisitorLog", VisitorLogSchema);

export default VisitorLog;
