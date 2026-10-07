import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { authResponse } from "@/lib/auth";
import { HttpError, handle } from "@/lib/http";
import User from "@/models/User";

export const POST = handle(async (req) => {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (name.length < 2) throw new HttpError(400, "Name must be at least 2 characters");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Enter a valid email address");
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");

  await connectDB();
  if (await User.findOne({ email })) throw new HttpError(409, "Email is already registered");

  const isFirst = (await User.countDocuments()) === 0;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const role = isFirst || (adminEmail && adminEmail === email) ? "admin" : "user";

  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role,
  });
  return authResponse(user, 201);
});
