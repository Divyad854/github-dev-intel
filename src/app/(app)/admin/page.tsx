"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, ErrorBox, PageHeader, Spinner, Stat, fmtDate } from "@/components/ui";
import { api } from "@/lib/api";

interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  mostAnalyzed: { username: string; avatar: string; count: number }[];
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[];
  recentAnalyses: { id: string; username: string; avatar: string; createdAt: string; by: string }[];
}

export default function AdminPage() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AdminStats>("/api/admin/stats")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Spinner />;

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview" />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <Stat label="Registered users" value={data.totalUsers} />
        <Stat label="GitHub analyses" value={data.totalAnalyses} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Most analyzed developers">
          <ul className="divide-y divide-slate-800">
            {data.mostAnalyzed.map((m) => (
              <li key={m.username} className="flex items-center gap-3 py-2.5 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.avatar} alt="" className="h-7 w-7 rounded-full" />
                <Link href={`/profile/${m.username}`} className="flex-1 hover:text-emerald-300">
                  {m.username}
                </Link>
                <span className="text-slate-400">{m.count}×</span>
              </li>
            ))}
            {!data.mostAnalyzed.length && <li className="py-2 text-sm text-slate-500">No analyses yet.</li>}
          </ul>
        </Card>

        <Card title="Recent users">
          <ul className="divide-y divide-slate-800">
            {data.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-slate-100">{u.name}</div>
                  <div className="truncate text-xs text-slate-500">{u.email}</div>
                </div>
                <div className="shrink-0 text-right text-xs text-slate-400">
                  <div>{u.role}</div>
                  <div>{fmtDate(u.createdAt, true)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recent analyses" className="lg:col-span-2">
          <ul className="divide-y divide-slate-800">
            {data.recentAnalyses.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.avatar} alt="" className="h-7 w-7 rounded-full" />
                <span className="flex-1">{a.username}</span>
                <span className="text-xs text-slate-500">by {a.by}</span>
                <span className="text-xs text-slate-400">{fmtDate(a.createdAt, true)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
