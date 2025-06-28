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
const Repo = mongoose.model("Repo", RepoSchema);
const StarHistory = mongoose.model("StarHistory", StarHistorySchema);
export { Repo, StarHistory };
//# sourceMappingURL=Repo.js.map