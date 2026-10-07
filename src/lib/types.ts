export type Role = "user" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface GhProfile {
  username: string;
  name: string | null;
  avatar: string;
  bio: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  url: string;
  location: string | null;
  company: string | null;
  blog: string | null;
  createdAt: string;
}

export interface RepoDTO {
  repoId: number;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  url: string;
  fork: boolean;
  homepage: string | null;
  license: string | null;
  archived: boolean;
}

export interface LanguageStat {
  language: string;
  count: number;
  percent: number;
}

export interface Scores {
  frontend: number;
  backend: number;
  openSource: number;
  activity: number;
  project: number;
}

export interface MonthCount {
  month: string;
  count: number;
}

export interface RepoBrief {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  date: string;
}

export interface ActivityInfo {
  recentlyCreated: RepoBrief[];
  recentlyUpdated: RepoBrief[];
  creationTrend: MonthCount[];
  totalStars: number;
  totalForks: number;
  pushedLast90Days: number;
  eventsLast30Days: number;
  eventTypes: Record<string, number>;
  externalContributions: number;
  lastPushAt: string | null;
}

export interface Recommendation {
  skill: string;
  reason: string;
}

export interface Analysis {
  profile: GhProfile;
  languages: LanguageStat[];
  allLanguages: LanguageStat[];
  topLanguage: string | null;
  diversity: { distinct: number; score: number; label: string };
  scores: Scores;
  activity: ActivityInfo;
  topRepos: RepoBrief[];
  currentSkills: string[];
  recommendations: Recommendation[];
  stats: {
    repos: number;
    ownRepos: number;
    forkedRepos: number;
    stars: number;
    forks: number;
    followers: number;
    following: number;
  };
  analyzedAt: string;
}

export interface Report {
  id: string;
  createdAt: string;
  cached?: boolean;
  analysis: Analysis;
}

export interface HistoryItem {
  id: string;
  username: string;
  avatar: string;
  createdAt: string;
  scores: Scores;
  topLanguage: string | null;
}

export interface SavedItem {
  username: string;
  name: string | null;
  avatar: string;
  savedAt: string;
}
