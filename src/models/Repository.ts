import mongoose, { Schema, type Model } from "mongoose";

const RepositorySchema = new Schema(
  {
    username: { type: String, required: true },
    usernameLower: { type: String, required: true, index: true },
    repoId: Number,
    name: { type: String, required: true },
    description: String,
    language: String,
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    topics: [String],
    createdAt: Date,
    updatedAt: Date,
    pushedAt: Date,
    url: String,
    fork: Boolean,
    homepage: String,
    license: String,
    archived: Boolean,
  },
  { timestamps: false }
);

RepositorySchema.index({ usernameLower: 1, stars: -1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Repository: Model<any> =
  mongoose.models.Repository || mongoose.model("Repository", RepositorySchema);
export default Repository;
