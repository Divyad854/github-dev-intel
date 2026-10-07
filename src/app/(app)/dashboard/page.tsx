"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Card, PageHeader, ScoreBar, Spinner, Stat, fmtDate } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadHistory } from "@/store/githubSlice";
import { loadSaved } from "@/store/savedProfilesSlice";

const LINKS = [
  { href: "/analyze", title: "Analyze GitHub", desc: "Enter a profile URL and get a full report" },
  { href: "/history", title: "My Analyses", desc: "Reopen previous reports and track progress" },
  { href: "/saved", title: "Saved Profiles", desc: "Developers you want to monitor" },
  { href: "/compare", title: "Compare Developers", desc: "Put two profiles side by side" },
];

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { history, historyLoading } = useAppSelector((s) => s.github);
  const saved = useAppSelector((s) => s.savedProfiles);

  useEffect(() => {
    dispatch(loadHistory());
    dispatch(loadSaved());
  }, [dispatch]);

  const unique = new Set(history.map((h) => h.username.toLowerCase())).size;
  const latest = history[0];

  return (
    <>
      <PageHeader title={`Welcome, ${user?.name ?? ""}`} subtitle="Your developer intelligence dashboard" />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Analyses run" value={history.length} />
        <Stat label="Developers analyzed" value={unique} />
        <Stat label="Saved profiles" value={saved.items.length} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="card transition hover:border-emerald-500/60">
            <div className="font-semibold text-slate-100">{l.title}</div>
            <p className="mt-1 text-sm text-slate-400">{l.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent analyses" action={<Link href="/history" className="text-sm text-emerald-400 hover:underline">View all</Link>}>
          {historyLoading && !history.length ? (
            <Spinner />
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nothing yet. <Link href="/analyze" className="text-emerald-400 hover:underline">Analyze your first profile</Link>.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {history.slice(0, 6).map((h) => (
                <li key={h.id}>
                  <Link href={`/profile/${h.username}?report=${h.id}`} className="flex items-center gap-3 py-2.5 hover:text-emerald-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.avatar} alt="" className="h-8 w-8 rounded-full" />
                    <span className="flex-1 text-sm font-medium">{h.username}</span>
                    <span className="text-xs text-slate-500">{fmtDate(h.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={latest ? `Latest: ${latest.username}` : "Latest scores"}>
          {latest ? (
            <div className="space-y-3">
              <ScoreBar label="Frontend" value={latest.scores.frontend} />
              <ScoreBar label="Backend" value={latest.scores.backend} />
              <ScoreBar label="Open Source" value={latest.scores.openSource} />
              <ScoreBar label="Activity" value={latest.scores.activity} />
              <ScoreBar label="Project" value={latest.scores.project} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Scores appear here after your first analysis.</p>
          )}
        </Card>
      </div>
    </>
  );
}
