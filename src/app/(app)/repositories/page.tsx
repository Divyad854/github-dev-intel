"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Card, ErrorBox, PageHeader, Spinner, fmtDate } from "@/components/ui";
import { searchRepos } from "@/store/githubSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function RepositoriesInner() {
  const dispatch = useAppDispatch();
  const qp = useSearchParams().get("username");
  const { repos, repoLanguages, reposLoading, report, error } = useAppSelector((s) => s.github);

  const [username, setUsername] = useState(qp ?? report?.analysis.profile.username ?? "");
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("stars");
  const [forks, setForks] = useState(false);

  useEffect(() => {
    if (!username.trim()) return;
    const t = setTimeout(() => {
      dispatch(searchRepos({ username: username.trim(), q, language, sort, forks }));
    }, 250);
    return () => clearTimeout(t);
  }, [username, q, language, sort, forks, dispatch]);

  return (
    <>
      <PageHeader title="Repositories" subtitle="Search and filter the repositories stored for an analyzed developer" />
      <Card className="mb-6">
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <label className="label">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="octocat" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Search</label>
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="name, description or topic" />
          </div>
          <div>
            <label className="label">Language</label>
            <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">All</option>
              {repoLanguages.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Sort by</label>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="stars">Stars</option>
              <option value="forks">Forks</option>
              <option value="updated">Last updated</option>
              <option value="created">Created</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={forks} onChange={(e) => setForks(e.target.checked)} /> Include forked repositories
        </label>
      </Card>

      <ErrorBox message={error} />
      {reposLoading && !repos.length ? (
        <Spinner />
      ) : !repos.length ? (
        <p className="text-sm text-slate-500">
          No repositories found. Make sure this developer was{" "}
          <Link href="/analyze" className="text-emerald-400 hover:underline">
            analyzed
          </Link>{" "}
          first.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {repos.map((r) => (
            <div key={r.repoId} className="card">
              <div className="flex items-start justify-between gap-3">
                <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-emerald-300 hover:underline">
                  {r.name}
                </a>
                <span className="shrink-0 text-xs text-slate-400">
                  ★ {r.stars} · ⑂ {r.forks}
                </span>
              </div>
              <p className="mt-1 min-h-[2.5rem] text-sm text-slate-400">{r.description || "No description"}</p>
              {r.topics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.topics.slice(0, 6).map((t) => (
                    <span key={t} className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>{r.language ?? "—"}</span>
                <span>Created {fmtDate(r.createdAt, true)}</span>
                <span>Updated {fmtDate(r.pushedAt, true)}</span>
                {r.fork && <span className="text-amber-400">fork</span>}
                {r.archived && <span className="text-rose-400">archived</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function RepositoriesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RepositoriesInner />
    </Suspense>
  );
}
