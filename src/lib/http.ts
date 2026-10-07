import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./auth";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Ctx = { params: Record<string, string> };

export function handle(fn: (req: NextRequest, ctx: Ctx) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      console.error(e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export async function requireSession(admin = false) {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Not authenticated");
  if (admin && session.role !== "admin") throw new HttpError(403, "Admin access required");
  return session;
}
