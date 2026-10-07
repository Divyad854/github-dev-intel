import { NextResponse } from "next/server";
import { extractUsername } from "@/lib/github";
import { HttpError, handle, requireSession } from "@/lib/http";
import { analyzeAndStore } from "@/lib/service";

export const POST = handle(async (req) => {
  const session = await requireSession();
  const body = await req.json().catch(() => ({}));
  const username = extractUsername(String(body.url ?? ""));
  if (!username) throw new HttpError(400, "Enter a valid GitHub profile URL, e.g. https://github.com/username");

  const report = await analyzeAndStore(username, session.id, Boolean(body.refresh));
  return NextResponse.json(report);
});
