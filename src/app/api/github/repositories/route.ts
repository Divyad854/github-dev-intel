import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { HttpError, handle, requireSession } from "@/lib/http";
import { toRepoDTO } from "@/lib/service";
import Repository from "@/models/Repository";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS: Record<string, Record<string, 1 | -1>> = {
  stars: { stars: -1 },
  forks: { forks: -1 },
  updated: { pushedAt: -1 },
  created: { createdAt: -1 },
  name: { name: 1 },
};

/** Search / filter the stored repositories of an analyzed user. */
export const GET = handle(async (req) => {
  await requireSession();
  const sp = req.nextUrl.searchParams;
  const username = (sp.get("username") ?? "").trim().toLowerCase();
  if (!username) throw new HttpError(400, "username is required");

  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { usernameLower: username };
  const q = (sp.get("q") ?? "").trim();
  const language = sp.get("language") ?? "";
  if (language) filter.language = language;
  if (sp.get("forks") !== "1") filter.fork = { $ne: true };
  if (q) {
    const re = new RegExp(escape(q), "i");
    filter.$or = [{ name: re }, { description: re }, { topics: re }];
  }

  const sort = SORTS[sp.get("sort") ?? "stars"] ?? SORTS.stars;
  const [docs, languages] = await Promise.all([
    Repository.find(filter).sort(sort).limit(300).lean(),
    Repository.distinct("language", { usernameLower: username, language: { $ne: null } }),
  ]);

  return NextResponse.json({
    repos: docs.map(toRepoDTO),
    languages: (languages as string[]).sort(),
    total: docs.length,
  });
});
