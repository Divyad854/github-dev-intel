import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signToken, verifyToken, type Session } from "./jwt";

export const COOKIE = "token";

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

export async function authResponse(
  user: { _id: unknown; name: string; email: string; role: "user" | "admin" },
  status = 200
) {
  const session: Session = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = await signToken(session);
  const res = NextResponse.json({ user: session }, { status });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
