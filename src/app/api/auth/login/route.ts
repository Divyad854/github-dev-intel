import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { authResponse } from "@/lib/auth";
import { HttpError, handle } from "@/lib/http";
import User from "@/models/User";

export const POST = handle(async (req) => {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) throw new HttpError(400, "Email and password are required");

  await connectDB();
  const user = await User.findOne({ email });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) throw new HttpError(401, "Invalid email or password");

  return authResponse(user);
});
