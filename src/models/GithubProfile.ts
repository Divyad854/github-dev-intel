import mongoose, { Schema, type Model } from "mongoose";

const GithubProfileSchema = new Schema(
  {
    username: { type: String, required: true },
    usernameLower: { type: String, required: true, unique: true },
    name: String,
    avatar: String,
    bio: String,
    followers: Number,
    following: Number,
    publicRepos: Number,
    url: String,
    location: String,
    company: String,
    blog: String,
    githubCreatedAt: Date,
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GithubProfile: Model<any> =
  mongoose.models.GithubProfile || mongoose.model("GithubProfile", GithubProfileSchema);
export default GithubProfile;
