import { HttpError } from "./http";
import type { GhProfile, RepoDTO } from "./types";
import type { GhEvent } from "./analysis";

const BASE = "https://api.github.com";

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "github-developer-intelligence",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, { headers: headers(), cache: "no-store" });
  if (res.status === 404) throw new HttpError(404, "GitHub user not found");
  if (res.status === 403 || res.status === 429) {
    throw new HttpError(
      429,
      "GitHub API rate limit reached. Add a GITHUB_TOKEN to .env.local to raise the limit."
    );
  }
  if (!res.ok) throw new HttpError(502, `GitHub API error (${res.status})`);
  return (await res.json()) as T;
}

export { extractUsername } from "./username";

interface RawUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  html_url: string;
  location: string | null;
  company: string | null;
  blog: string | null;
  created_at: string;
}

interface RawRepo {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics?: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  html_url: string;
  fork: boolean;
  homepage: string | null;
  license: { spdx_id: string | null; name: string } | null;
  archived: boolean;
}

export interface GithubData {
  profile: GhProfile;
  repos: RepoDTO[];
  events: GhEvent[];
}

export async function fetchGithubData(username: string): Promise<GithubData> {
  const u = encodeURIComponent(username);
  const raw = await gh<RawUser>(`/users/${u}`);

  const rawRepos: RawRepo[] = [];
  for (let page = 1; page <= 3; page++) {
    const batch = await gh<RawRepo[]>(`/users/${u}/repos?per_page=100&type=owner&sort=pushed&page=${page}`);
    rawRepos.push(...batch);
    if (batch.length < 100) break;
  }

  let events: GhEvent[] = [];
  try {
    events = await gh<GhEvent[]>(`/users/${u}/events/public?per_page=100`);
  } catch {
    events = []; // activity feed is optional
  }

  const profile: GhProfile = {
    username: raw.login,
    name: raw.name,
    avatar: raw.avatar_url,
    bio: raw.bio,
    followers: raw.followers,
    following: raw.following,
    publicRepos: raw.public_repos,
    url: raw.html_url,
    location: raw.location,
    company: raw.company,
    blog: raw.blog,
    createdAt: raw.created_at,
  };

  const repos: RepoDTO[] = rawRepos.map((r) => ({
    repoId: r.id,
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    forks: r.forks_count,
    topics: r.topics ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    pushedAt: r.pushed_at ?? r.updated_at,
    url: r.html_url,
    fork: r.fork,
    homepage: r.homepage || null,
    license: r.license ? r.license.spdx_id || r.license.name : null,
    archived: r.archived,
  }));

  return { profile, repos, events };
}
