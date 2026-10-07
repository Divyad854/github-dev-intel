import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { extractUsername } from "@/lib/github";
import { HttpError, handle, requireSession } from "@/lib/http";
import { analyzeAndStore } from "@/lib/service";
import type { SavedItem } from "@/lib/types";
import GithubProfile from "@/models/GithubProfile";
import SavedProfile from "@/models/SavedProfile";

export const GET = handle(async () => {
  const session = await requireSession();
  await connectDB();
  const docs = await SavedProfile.find({ userId: session.id }).sort({ createdAt: -1 }).lean();
  const items: SavedItem[] = docs.map((d) => ({
    username: d.username,
    name: d.name ?? null,
    avatar: d.avatar,
    savedAt: new Date(d.createdAt).toISOString(),
  }));
  return NextResponse.json({ items });
});

export const POST = handle(async (req) => {
  const session = await requireSession();
  const body = await req.json().catch(() => ({}));
  const username = extractUsername(String(body.username ?? ""));
  if (!username) throw new HttpError(400, "Invalid GitHub username");

  await connectDB();
  const key = username.toLowerCase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profile = await GithubProfile.findOne({ usernameLower: key }).lean<any>();
  if (!profile) {
    await analyzeAndStore(username, session.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile = await GithubProfile.findOne({ usernameLower: key }).lean<any>();
  }
  if (!profile) throw new HttpError(404, "GitHub user not found");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = await SavedProfile.findOneAndUpdate(
    { userId: session.id, usernameLower: key },
    { username: profile.username, name: profile.name ?? null, avatar: profile.avatar },
    { upsert: true, new: true }
  );
  const item: SavedItem = {
    username: doc.username,
    name: doc.name ?? null,
    avatar: doc.avatar,
    savedAt: new Date(doc.createdAt).toISOString(),
  };
  return NextResponse.json({ item }, { status: 201 });
});

export const DELETE = handle(async (req) => {
  const session = await requireSession();
  const username = (req.nextUrl.searchParams.get("username") ?? "").toLowerCase();
  if (!username) throw new HttpError(400, "username is required");
  await connectDB();
  await SavedProfile.deleteOne({ userId: session.id, usernameLower: username });
  return NextResponse.json({ ok: true });
});
