import type {
  ActivityInfo,
  Analysis,
  GhProfile,
  LanguageStat,
  Recommendation,
  RepoBrief,
  RepoDTO,
  Scores,
} from "./types";

export interface GhEvent {
  type: string;
  created_at: string;
  repo: { name: string };
}

const DAY = 86_400_000;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const sat = (x: number, k: number) => 1 - Math.exp(-x / k); // 0..1 with diminishing returns
const ratio = (a: number, b: number) => (b ? a / b : 0);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]/g, "");

const ALIASES: Record<string, string> = {
  node: "nodejs",
  postgres: "postgresql",
  tailwind: "tailwindcss",
  mongoose: "mongodb",
  mongo: "mongodb",
  next: "nextjs",
  reactjs: "react",
  vuejs: "vue",
  ts: "typescript",
  js: "javascript",
};

const KNOWN: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  go: "Go",
  rust: "Rust",
  "c++": "C++",
  "c#": "C#",
  php: "PHP",
  ruby: "Ruby",
  kotlin: "Kotlin",
  swift: "Swift",
  dart: "Dart",
  html: "HTML",
  css: "CSS",
  react: "React",
  nextjs: "Next.js",
  vue: "Vue",
  angular: "Angular",
  svelte: "Svelte",
  tailwindcss: "Tailwind CSS",
  redux: "Redux",
  nodejs: "Node.js",
  express: "Express",
  nestjs: "NestJS",
  mongodb: "MongoDB",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  graphql: "GraphQL",
  docker: "Docker",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  spring: "Spring",
  laravel: "Laravel",
  firebase: "Firebase",
  redis: "Redis",
  prisma: "Prisma",
  jest: "Jest",
  vitest: "Vitest",
  cypress: "Cypress",
  playwright: "Playwright",
  githubactions: "GitHub Actions",
};

const FRONT_LANGS = ["html", "css", "scss", "vue", "svelte", "javascript", "typescript"];
const FRONT_TAGS = [
  "react", "nextjs", "vue", "angular", "svelte", "tailwindcss", "frontend", "redux", "vite",
  "webpack", "nuxt", "bootstrap", "css", "html", "ui", "website", "portfolio", "landing",
];
const BACK_LANGS = [
  "python", "java", "go", "rust", "c#", "php", "ruby", "kotlin", "c++", "c", "scala",
  "elixir", "shell", "dockerfile", "sql", "plpgsql",
];
const BACK_TAGS = [
  "nodejs", "express", "api", "rest", "graphql", "mongodb", "postgresql", "mysql", "sql",
  "backend", "django", "flask", "fastapi", "spring", "laravel", "docker", "redis",
  "microservices", "prisma", "nestjs", "server", "firebase", "jwt", "auth",
];
const TEST_TAGS = ["jest", "vitest", "cypress", "playwright", "testing", "test", "pytest", "junit", "mocha"];

function repoTags(r: RepoDTO): Set<string> {
  const t = new Set<string>();
  const add = (raw: string) => {
    const n = norm(raw);
    if (!n) return;
    t.add(n);
    if (ALIASES[n]) t.add(ALIASES[n]);
  };
  if (r.language) add(r.language);
  for (const topic of r.topics) {
    add(topic);
    topic.toLowerCase().split("-").forEach(add);
  }
  add(r.name);
  r.name.toLowerCase().split(/[^a-z0-9]+/).forEach(add);
  return t;
}

const intersects = (tags: Set<string>, list: string[]) => list.some((x) => tags.has(x));

function brief(r: RepoDTO, date: string): RepoBrief {
  return {
    name: r.name,
    url: r.url,
    description: r.description,
    language: r.language,
    stars: r.stars,
    forks: r.forks,
    date,
  };
}

function languageStats(repos: RepoDTO[]) {
  const counts = new Map<string, number>();
  for (const r of repos) if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
  const all: LanguageStat[] = sorted.map(([language, count]) => ({ language, count, percent: pct(count) }));

  let display = all;
  if (all.length > 5) {
    const rest = all.slice(5).reduce((a, l) => a + l.count, 0);
    display = [...all.slice(0, 5), { language: "Other", count: rest, percent: pct(rest) }];
  }
  return { all, display, total };
}

function diversity(all: LanguageStat[], total: number) {
  const distinct = all.length;
  let entropy = 0;
  for (const l of all) {
    const p = l.count / total;
    entropy -= p * Math.log(p);
  }
  const normEntropy = distinct > 1 ? entropy / Math.log(distinct) : 0;
  const score = clamp(100 * (0.5 * Math.min(1, distinct / 8) + 0.5 * normEntropy));
  const label = score < 25 ? "Specialist" : score < 50 ? "Balanced" : score < 75 ? "Diverse" : "Polyglot";
  return { distinct, score, label };
}

export function analyze(profile: GhProfile, repos: RepoDTO[], events: GhEvent[]): Analysis {
  const now = Date.now();
  const own = repos.filter((r) => !r.fork);
  const base = own.length ? own : repos;
  const tagged = base.map((r) => ({ r, tags: repoTags(r) }));

  // ---- Languages -----------------------------------------------------------
  const langs = languageStats(base);
  const topLanguage = langs.all[0]?.language ?? null;
  const div = diversity(langs.all, langs.total || 1);

  // ---- Totals --------------------------------------------------------------
  const stars = own.reduce((a, r) => a + r.stars, 0);
  const forks = own.reduce((a, r) => a + r.forks, 0);

  // ---- Frontend / Backend --------------------------------------------------
  const domainScore = (matches: number) => {
    if (!base.length) return 0;
    return clamp(100 * (0.55 * sat(matches, 5) + 0.45 * ratio(matches, base.length)));
  };
  const frontMatches = tagged.filter(
    ({ r, tags }) => (r.language && FRONT_LANGS.includes(norm(r.language))) || intersects(tags, FRONT_TAGS)
  ).length;
  const backMatches = tagged.filter(
    ({ r, tags }) => (r.language && BACK_LANGS.includes(norm(r.language))) || intersects(tags, BACK_TAGS)
  ).length;

  // ---- Events --------------------------------------------------------------
  const me = profile.username.toLowerCase();
  const events30 = events.filter((e) => now - new Date(e.created_at).getTime() <= 30 * DAY);
  const eventTypes: Record<string, number> = {};
  for (const e of events) eventTypes[e.type.replace(/Event$/, "")] = (eventTypes[e.type.replace(/Event$/, "")] ?? 0) + 1;
  const CONTRIB = ["PushEvent", "PullRequestEvent", "IssuesEvent", "PullRequestReviewEvent", "IssueCommentEvent"];
  const external = events.filter(
    (e) => CONTRIB.includes(e.type) && !e.repo.name.toLowerCase().startsWith(me + "/")
  ).length;

  // ---- Open source ---------------------------------------------------------
  const licensedShare = ratio(own.filter((r) => r.license).length, own.length);
  const openSource = clamp(
    100 *
      (0.3 * sat(stars, 50) +
        0.15 * sat(forks, 20) +
        0.15 * licensedShare +
        0.25 * sat(external, 10) +
        0.15 * sat(profile.followers, 100))
  );

  // ---- Activity ------------------------------------------------------------
  const pushed90 = repos.filter((r) => now - new Date(r.pushedAt).getTime() <= 90 * DAY).length;
  const lastPush = repos.reduce<number>((m, r) => Math.max(m, new Date(r.pushedAt).getTime()), 0);
  const daysSince = lastPush ? (now - lastPush) / DAY : 999;
  const activity = clamp(
    100 * (0.35 * sat(pushed90, 6) + 0.35 * sat(events30.length, 20) + 0.3 * Math.exp(-daysSince / 60))
  );

  // ---- Project quality -----------------------------------------------------
  const live = own.filter((r) => !r.archived);
  const avgStars = ratio(stars, own.length);
  const project = own.length
    ? clamp(
        100 *
          (0.2 * ratio(own.filter((r) => r.description).length, own.length) +
            0.15 * ratio(own.filter((r) => r.topics.length).length, own.length) +
            0.1 * ratio(own.filter((r) => r.homepage).length, own.length) +
            0.15 * licensedShare +
            0.2 * sat(avgStars, 5) +
            0.2 * sat(live.length, 10))
      )
    : 0;

  const scores: Scores = {
    frontend: domainScore(frontMatches),
    backend: domainScore(backMatches),
    openSource,
    activity,
    project,
  };

  // ---- Activity details ----------------------------------------------------
  const trend: { month: string; count: number }[] = [];
  const cursor = new Date();
  cursor.setUTCDate(1);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1));
    trend.push({ month: d.toISOString().slice(0, 7), count: 0 });
  }
  for (const r of repos) {
    const k = r.createdAt.slice(0, 7);
    const slot = trend.find((t) => t.month === k);
    if (slot) slot.count++;
  }

  const activityInfo: ActivityInfo = {
    recentlyCreated: [...repos]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5)
      .map((r) => brief(r, r.createdAt)),
    recentlyUpdated: [...repos]
      .sort((a, b) => +new Date(b.pushedAt) - +new Date(a.pushedAt))
      .slice(0, 5)
      .map((r) => brief(r, r.pushedAt)),
    creationTrend: trend,
    totalStars: stars,
    totalForks: forks,
    pushedLast90Days: pushed90,
    eventsLast30Days: events30.length,
    eventTypes,
    externalContributions: external,
    lastPushAt: lastPush ? new Date(lastPush).toISOString() : null,
  };

  // ---- Skills & recommendations -------------------------------------------
  const tagCount = new Map<string, number>();
  const tech = new Set<string>();
  for (const { tags } of tagged) {
    for (const t of tags) {
      tech.add(t);
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
  }
  const currentSkills = [...tagCount.entries()]
    .filter(([k]) => KNOWN[k])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k]) => KNOWN[k]);

  const has = (...k: string[]) => k.some((x) => tech.has(x));
  const recs: Recommendation[] = [];
  const push = (skill: string, reason: string) => {
    if (recs.length < 6 && !recs.some((r) => r.skill === skill)) recs.push({ skill, reason });
  };

  const hasFE = has("react", "vue", "angular", "svelte", "nextjs");
  if (has("javascript") && !has("typescript"))
    push("TypeScript", "You write JavaScript but no TypeScript was found. Static typing catches bugs earlier and is expected in most modern teams.");
  if (has("react") && !has("nextjs"))
    push("Next.js", "You use React; Next.js adds routing, server rendering and API routes for production apps.");
  if ((hasFE || scores.frontend >= 50) && !has(...TEST_TAGS))
    push("Testing (Jest / Vitest / Playwright)", "No testing tools were detected. Tests make projects look more professional and safer to change.");
  if (has("python") && !has("django", "flask", "fastapi"))
    push("FastAPI", "You use Python; a web framework like FastAPI turns scripts into deployable APIs.");
  if (has("nodejs", "express") && !has("mongodb", "postgresql", "mysql", "sql", "prisma"))
    push("Databases (PostgreSQL / MongoDB)", "Your backend projects do not show a database. Persisting data is a core backend skill.");
  if ((has("nodejs", "express") || scores.backend >= 50) && !has("docker"))
    push("Docker", "Containerizing apps makes them reproducible and easier to deploy.");
  if (has("nodejs", "express") && !has("nestjs", "graphql"))
    push("NestJS or GraphQL", "Structured backend frameworks and typed APIs are a natural next step after Express.");
  if (hasFE && !has("tailwindcss"))
    push("Tailwind CSS", "A utility-first CSS workflow speeds up UI development.");
  if (!has("githubactions"))
    push("CI/CD with GitHub Actions", "Automating tests and deploys is a visible sign of engineering maturity.");
  if (scores.openSource < 40)
    push("Open-source contributions", "Contributing issues or pull requests to other projects boosts visibility and collaboration skills.");
  if (own.length && ratio(own.filter((r) => r.description).length, own.length) < 0.6)
    push("Documentation & READMEs", "Many repositories have no description. Clear READMEs make projects easier to evaluate.");
  if (scores.activity < 40)
    push("Consistent commit habit", "Recent activity is low. Regular small contributions keep your profile fresh.");
  if (!recs.length) {
    push("System design", "Your stack looks well-rounded; designing larger systems is the next level.");
    push("Data structures & algorithms", "Strong fundamentals help in interviews and performance work.");
  }

  return {
    profile,
    languages: langs.display,
    allLanguages: langs.all,
    topLanguage,
    diversity: div,
    scores,
    activity: activityInfo,
    topRepos: [...own]
      .sort((a, b) => b.stars - a.stars || +new Date(b.pushedAt) - +new Date(a.pushedAt))
      .slice(0, 6)
      .map((r) => brief(r, r.pushedAt)),
    currentSkills,
    recommendations: recs,
    stats: {
      repos: profile.publicRepos,
      ownRepos: own.length,
      forkedRepos: repos.length - own.length,
      stars,
      forks,
      followers: profile.followers,
      following: profile.following,
    },
    analyzedAt: new Date().toISOString(),
  };
}
