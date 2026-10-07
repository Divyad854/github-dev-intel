import type { Analysis } from "./types";

export interface CompareRow {
  label: string;
  a: number;
  b: number;
  suffix: string;
  winner: "a" | "b" | "tie";
}

const tsPercent = (x: Analysis) => x.allLanguages.find((l) => l.language === "TypeScript")?.percent ?? 0;
const overall = (x: Analysis) => {
  const s = x.scores;
  return Math.round((s.frontend + s.backend + s.openSource + s.activity + s.project) / 5);
};

export function buildComparison(a: Analysis, b: Analysis): CompareRow[] {
  const row = (label: string, av: number, bv: number, suffix = ""): CompareRow => ({
    label,
    a: av,
    b: bv,
    suffix,
    winner: av === bv ? "tie" : av > bv ? "a" : "b",
  });
  return [
    row("Public repos", a.stats.repos, b.stats.repos),
    row("Stars", a.stats.stars, b.stats.stars),
    row("Forks", a.stats.forks, b.stats.forks),
    row("Followers", a.stats.followers, b.stats.followers),
    row("TypeScript", tsPercent(a), tsPercent(b), "%"),
    row("Languages used", a.diversity.distinct, b.diversity.distinct),
    row("Tech diversity", a.diversity.score, b.diversity.score, "%"),
    row("Frontend", a.scores.frontend, b.scores.frontend, "%"),
    row("Backend", a.scores.backend, b.scores.backend, "%"),
    row("Open Source", a.scores.openSource, b.scores.openSource, "%"),
    row("Activity", a.scores.activity, b.scores.activity, "%"),
    row("Project quality", a.scores.project, b.scores.project, "%"),
    row("Overall", overall(a), overall(b), "%"),
  ];
}

export { overall };
