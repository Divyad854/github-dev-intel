"use client";

import Link from "next/link";
import type { Report } from "@/lib/types";
import { Card, LanguageBar, ScoreBar, Stat, fmtDate } from "./ui";

interface Props {
  report: Report;
  saved: boolean;
  busy?: boolean;
  onToggleSave: () => void;
  onRefresh: () => void;
}

export default function ReportView({ report, saved, busy, onToggleSave, onRefresh }: Props) {
  const a = report.analysis;
  const p = a.profile;
  const maxTrend = Math.max(1, ...a.activity.creationTrend.map((t) => t.count));

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card>
        <div className="flex flex-wrap items-start gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.avatar} alt={p.username} className="h-24 w-24 rounded-full border border-slate-700" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-100">{p.name || p.username}</h1>
            <a href={p.url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
              @{p.username}
            </a>
            {p.bio && <p className="mt-2 max-w-2xl text-sm text-slate-300">{p.bio}</p>}
            <p className="mt-2 text-xs text-slate-500">
              {[p.location, p.company, `Joined ${fmtDate(p.createdAt, true)}`].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Report generated {fmtDate(report.createdAt, true)}
              {report.cached ? " (served from your database cache)" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={onToggleSave} disabled={busy}>
              {saved ? "✓ Saved" : "☆ Save profile"}
            </button>
            <button className="btn" onClick={onRefresh} disabled={busy}>
              {busy ? "Refreshing…" : "Re-analyze"}
            </button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Followers" value={a.stats.followers} />
          <Stat label="Following" value={a.stats.following} />
          <Stat label="Public repos" value={a.stats.repos} />
          <Stat label="Stars" value={a.stats.stars} />
          <Stat label="Forks" value={a.stats.forks} />
          <Stat label="Top language" value={a.topLanguage ?? "—"} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Developer Intelligence Score">
          <div className="space-y-4">
            <ScoreBar label="Frontend" value={a.scores.frontend} />
            <ScoreBar label="Backend" value={a.scores.backend} />
            <ScoreBar label="Open Source" value={a.scores.openSource} />
            <ScoreBar label="Activity" value={a.scores.activity} />
            <ScoreBar label="Project quality" value={a.scores.project} />
          </div>
          <p className="mt-4 text-xs text-slate-500">
            These scores are calculated by this app from public GitHub data. They are not GitHub metrics.
          </p>
        </Card>

        <Card title="Technology Analysis">
          <LanguageBar languages={a.languages} />
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Languages" value={a.diversity.distinct} />
            <Stat label="Diversity" value={`${a.diversity.score}%`} />
            <Stat label="Profile type" value={<span className="text-base">{a.diversity.label}</span>} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Skills & Recommendations">
          <div className="mb-4">
            <div className="label">Current</div>
            <div className="flex flex-wrap gap-2">
              {a.currentSkills.length ? (
                a.currentSkills.map((s) => (
                  <span key={s} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">Not enough data detected.</span>
              )}
            </div>
          </div>
          <div className="label">Recommended</div>
          <ul className="space-y-3">
            {a.recommendations.map((r) => (
              <li key={r.skill} className="text-sm">
                <span className="font-semibold text-emerald-300">→ {r.skill}</span>
                <p className="text-slate-400">{r.reason}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Repository creation trend (12 months)">
          <div className="flex h-36 items-end gap-1.5">
            {a.activity.creationTrend.map((t) => (
              <div key={t.month} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${t.month}: ${t.count}`}>
                <span className="text-[10px] text-slate-500">{t.count || ""}</span>
                <div
                  className="w-full rounded-t bg-emerald-500/80"
                  style={{ height: `${Math.max(3, (t.count / maxTrend) * 100)}px` }}
                />
                <span className="text-[10px] text-slate-500">{t.month.slice(5)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Pushed (90d)" value={a.activity.pushedLast90Days} />
            <Stat label="Events (30d)" value={a.activity.eventsLast30Days} />
            <Stat label="Outside repos" value={a.activity.externalContributions} />
            <Stat label="Last push" value={<span className="text-base">{a.activity.lastPushAt ? fmtDate(a.activity.lastPushAt, true) : "—"}</span>} />
          </div>
          {Object.keys(a.activity.eventTypes).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
              {Object.entries(a.activity.eventTypes)
                .sort((x, y) => y[1] - x[1])
                .map(([k, v]) => (
                  <span key={k} className="rounded bg-slate-800 px-2 py-1">
                    {k} · {v}
                  </span>
                ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RepoMini title="Recently updated" repos={a.activity.recentlyUpdated} />
        <RepoMini title="Recently created" repos={a.activity.recentlyCreated} />
      </div>

      <RepoMini
        title="Top repositories"
        repos={a.topRepos}
        action={
          <Link href={`/repositories?username=${p.username}`} className="text-sm text-emerald-400 hover:underline">
            Browse all repositories →
          </Link>
        }
      />
    </div>
  );
}

function RepoMini({
  title,
  repos,
  action,
}: {
  title: string;
  repos: Report["analysis"]["topRepos"];
  action?: React.ReactNode;
}) {
  return (
    <Card title={title} action={action}>
      {repos.length === 0 ? (
        <p className="text-sm text-slate-500">No repositories.</p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {repos.map((r) => (
            <li key={r.name} className="flex items-start justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-emerald-300 hover:underline">
                  {r.name}
                </a>
                {r.description && <p className="truncate text-xs text-slate-500">{r.description}</p>}
              </div>
              <div className="shrink-0 text-right text-xs text-slate-400">
                <div>
                  ★ {r.stars} · ⑂ {r.forks}
                </div>
                <div>
                  {r.language ?? "—"} · {fmtDate(r.date)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
