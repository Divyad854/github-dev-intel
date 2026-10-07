import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { authResponse, clearAuthCookie } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { HttpError, handle, requireSession } from "@/lib/http";
import User from "@/models/User";

export const GET = handle(async () => {
  const session = await requireSession();
  await connectDB();
  const user = await User.findById(session.id);
  if (!user) return clearAuthCookie(NextResponse.json({ error: "Not authenticated" }, { status: 401 }));
  return NextResponse.json({
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
  });
});

/** Update name and/or password. */
export const PATCH = handle(async (req) => {
  const session = await requireSession();
  const body = await req.json().catch(() => ({}));
  await connectDB();
  const user = await User.findById(session.id);
  if (!user) throw new HttpError(401, "Not authenticated");

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) throw new HttpError(400, "Name must be at least 2 characters");
    user.name = name;
  }

  if (body.newPassword !== undefined) {
    const next = String(body.newPassword);
    if (next.length < 8) throw new HttpError(400, "New password must be at least 8 characters");
    const ok = await bcrypt.compare(String(body.currentPassword ?? ""), user.passwordHash);
    if (!ok) throw new HttpError(400, "Current password is incorrect");
    user.passwordHash = await bcrypt.hash(next, 12);
  }

  await user.save();
  return authResponse(user);
});
