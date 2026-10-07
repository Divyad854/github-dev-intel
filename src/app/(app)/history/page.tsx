"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Card, ErrorBox, PageHeader, Spinner, fmtDate } from "@/components/ui";
import type { HistoryItem } from "@/lib/types";
import { deleteReport, loadHistory } from "@/store/githubSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const KEYS = [
  ["frontend", "Frontend"],
  ["backend", "Backend"],
  ["openSource", "Open Source"],
  ["activity", "Activity"],
  ["project", "Project"],
] as const;

function Delta({ now, prev }: { now: number; prev?: number }) {
  if (prev === undefined || prev === now) return null;
  const d = now - prev;
  return <span className={d > 0 ? "text-emerald-400" : "text-rose-400"}> ({d > 0 ? "+" : ""}{d})</span>;
}

export default function HistoryPage() {
  const dispatch = useAppDispatch();
  const { history, historyLoading, error } = useAppSelector((s) => s.github);

  useEffect(() => {
    dispatch(loadHistory());
  }, [dispatch]);

  const groups = useMemo(() => {
    const map = new Map<string, HistoryItem[]>();
    for (const h of history) {
      const k = h.username.toLowerCase();
      map.set(k, [...(map.get(k) ?? []), h]);
    }
    return [...map.values()];
  }, [history]);

  return (
    <>
      <PageHeader title="My Analyses" subtitle="Every report you've generated. Open one to see it exactly as it was." />
      <ErrorBox message={error} />
      {historyLoading && !history.length ? (
        <Spinner />
      ) : groups.length === 0 ? (
        <p className="text-sm text-slate-500">
          No analyses yet. <Link href="/analyze" className="text-emerald-400 hover:underline">Analyze a profile</Link>.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((entries) => (
            <Card key={entries[0].username}>
              <div className="mb-4 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entries[0].avatar} alt="" className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <div className="font-semibold text-slate-100">{entries[0].username}</div>
                  <div className="text-xs text-slate-500">{entries.length} {entries.length === 1 ? "analysis" : "analyses"}</div>
                </div>
              </div>
              <ul className="space-y-3">
                {entries.map((h, i) => {
                  const older = entries[i + 1];
                  return (
                    <li key={h.id} className="rounded-lg bg-slate-950/50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200" title={new Date(h.createdAt).toLocaleString()}>
                          {fmtDate(h.createdAt)}
                        </span>
                        <span className="flex gap-3 text-sm">
                          <Link href={`/profile/${h.username}?report=${h.id}`} className="text-emerald-400 hover:underline">
                            Open report
                          </Link>
                          <button
                            onClick={() => confirm("Delete this report?") && dispatch(deleteReport(h.id))}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            Delete
                          </button>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-5">
                        {KEYS.map(([k, label]) => (
                          <div key={k} className="text-slate-400">
                            {label}: <span className="font-semibold text-slate-100">{h.scores[k]}%</span>
                            <Delta now={h.scores[k]} prev={older?.scores[k]} />
                          </div>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
