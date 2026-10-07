import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { handle } from "@/lib/http";

export const POST = handle(async () => {
  return clearAuthCookie(NextResponse.json({ ok: true }));
});
