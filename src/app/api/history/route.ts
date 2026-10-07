import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { handle, requireSession } from "@/lib/http";
import AnalysisHistory from "@/models/AnalysisHistory";
import type { HistoryItem } from "@/lib/types";

export const GET = handle(async () => {
  const session = await requireSession();
  await connectDB();
  const docs = await AnalysisHistory.find({ userId: session.id })
    .sort({ createdAt: -1 })
    .limit(200)
    .select("username avatar scores topLanguage createdAt")
    .lean();

  const items: HistoryItem[] = docs.map((d) => ({
    id: String(d._id),
    username: d.username,
    avatar: d.avatar,
    createdAt: new Date(d.createdAt).toISOString(),
    scores: d.scores,
    topLanguage: d.topLanguage ?? null,
  }));
  return NextResponse.json({ items });
});
