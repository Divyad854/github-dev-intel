import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { HttpError, handle, requireSession } from "@/lib/http";
import { toReport } from "@/lib/service";
import AnalysisHistory from "@/models/AnalysisHistory";

async function load(id: string, userId: string, isAdmin: boolean) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Report not found");
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await AnalysisHistory.findById(id).lean<any>();
  if (!doc || (String(doc.userId) !== userId && !isAdmin)) throw new HttpError(404, "Report not found");
  return doc;
}

export const GET = handle(async (_req, { params }) => {
  const session = await requireSession();
  const doc = await load(params.id, session.id, session.role === "admin");
  return NextResponse.json(toReport(doc));
});

export const DELETE = handle(async (_req, { params }) => {
  const session = await requireSession();
  const doc = await load(params.id, session.id, false);
  await AnalysisHistory.deleteOne({ _id: doc._id });
  return NextResponse.json({ ok: true });
});
