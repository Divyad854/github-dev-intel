import { SignJWT, jwtVerify } from "jose";

export interface Session {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production");
    }
    return new TextEncoder().encode("dev-only-secret-change-me-please-0123456789");
  }
  return new TextEncoder().encode(s);
}

export async function signToken(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}
