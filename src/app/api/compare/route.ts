import { NextResponse } from "next/server";
import { extractUsername } from "@/lib/github";
import { HttpError, handle, requireSession } from "@/lib/http";
import { analyzeAndStore } from "@/lib/service";

export const POST = handle(async (req) => {
  const session = await requireSession();
  const body = await req.json().catch(() => ({}));
  const a = extractUsername(String(body.a ?? ""));
  const b = extractUsername(String(body.b ?? ""));
  if (!a || !b) throw new HttpError(400, "Enter two valid GitHub profile URLs or usernames");
  if (a.toLowerCase() === b.toLowerCase()) throw new HttpError(400, "Choose two different developers");

  const refresh = Boolean(body.refresh);
  const ra = await analyzeAndStore(a, session.id, refresh);
  const rb = await analyzeAndStore(b, session.id, refresh);
  return NextResponse.json({ a: ra, b: rb });
});
