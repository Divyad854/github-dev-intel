import mongoose, { Schema, type Model } from "mongoose";

const SavedProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    usernameLower: { type: String, required: true },
    name: String,
    avatar: String,
  },
  { timestamps: true }
);

SavedProfileSchema.index({ userId: 1, usernameLower: 1 }, { unique: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SavedProfile: Model<any> =
  mongoose.models.SavedProfile || mongoose.model("SavedProfile", SavedProfileSchema);
export default SavedProfile;
