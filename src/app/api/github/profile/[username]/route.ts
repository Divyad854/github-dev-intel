import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { HttpError, handle, requireSession } from "@/lib/http";
import { toReport } from "@/lib/service";
import AnalysisHistory from "@/models/AnalysisHistory";

/** Latest stored analysis for a username (no GitHub call). */
export const GET = handle(async (_req, { params }) => {
  const session = await requireSession();
  await connectDB();
  const key = params.username.toLowerCase();

  const mine = await AnalysisHistory.findOne({ usernameLower: key, userId: session.id })
    .sort({ createdAt: -1 })
    .lean();
  const doc = mine ?? (await AnalysisHistory.findOne({ usernameLower: key }).sort({ createdAt: -1 }).lean());
  if (!doc) throw new HttpError(404, "No analysis stored for this user yet");
  return NextResponse.json(toReport(doc));
});
