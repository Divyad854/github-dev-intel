import { connectDB } from "./db";
import { analyze } from "./analysis";
import { fetchGithubData } from "./github";
import type { RepoDTO, Report } from "./types";
import GithubProfile from "@/models/GithubProfile";
import Repository from "@/models/Repository";
import AnalysisHistory from "@/models/AnalysisHistory";

const CACHE_MS = 10 * 60 * 1000;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toReport(doc: any): Report {
  return {
    id: String(doc._id),
    createdAt: new Date(doc.createdAt).toISOString(),
    analysis: doc.analysis,
  };
}

export function toRepoDTO(r: any): RepoDTO {
  return {
    repoId: r.repoId,
    name: r.name,
    description: r.description ?? null,
    language: r.language ?? null,
    stars: r.stars ?? 0,
    forks: r.forks ?? 0,
    topics: r.topics ?? [],
    createdAt: new Date(r.createdAt).toISOString(),
    updatedAt: new Date(r.updatedAt).toISOString(),
    pushedAt: new Date(r.pushedAt).toISOString(),
    url: r.url,
    fork: !!r.fork,
    homepage: r.homepage ?? null,
    license: r.license ?? null,
    archived: !!r.archived,
  };
}

/**
 * Analyze a GitHub user and persist everything in MongoDB.
 * Recent data (< 10 min) is served from the database instead of calling GitHub again.
 */
export async function analyzeAndStore(
  username: string,
  userId: string,
  refresh = false
): Promise<Report & { cached: boolean }> {
  await connectDB();
  const key = username.toLowerCase();

  if (!refresh) {
    const stored = await GithubProfile.findOne({ usernameLower: key }).lean<any>();
    if (stored && Date.now() - new Date(stored.fetchedAt).getTime() < CACHE_MS) {
      const last = await AnalysisHistory.findOne({ usernameLower: key }).sort({ createdAt: -1 }).lean<any>();
      if (last) {
        if (String(last.userId) === userId) return { ...toReport(last), cached: true };
        // Someone else analyzed it moments ago: reuse the data but record it in this user's history.
        const copy = await AnalysisHistory.create({
          userId,
          username: last.username,
          usernameLower: key,
          avatar: last.avatar,
          topLanguage: last.topLanguage,
          scores: last.scores,
          analysis: last.analysis,
        });
        return { ...toReport(copy), cached: true };
      }
    }
  }

  const data = await fetchGithubData(username);
  const analysis = analyze(data.profile, data.repos, data.events);
  const p = data.profile;

  await GithubProfile.findOneAndUpdate(
    { usernameLower: key },
    {
      username: p.username,
      usernameLower: key,
      name: p.name,
      avatar: p.avatar,
      bio: p.bio,
      followers: p.followers,
      following: p.following,
      publicRepos: p.publicRepos,
      url: p.url,
      location: p.location,
      company: p.company,
      blog: p.blog,
      githubCreatedAt: p.createdAt,
      fetchedAt: new Date(),
    },
    { upsert: true }
  );

  await Repository.deleteMany({ usernameLower: key });
  if (data.repos.length) {
    await Repository.insertMany(
      data.repos.map((r) => ({ ...r, username: p.username, usernameLower: key }))
    );
  }

  const doc = await AnalysisHistory.create({
    userId,
    username: p.username,
    usernameLower: key,
    avatar: p.avatar,
    topLanguage: analysis.topLanguage,
    scores: analysis.scores,
    analysis,
  });

  return { ...toReport(doc), cached: false };
}
