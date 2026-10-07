"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { buildComparison } from "@/lib/compare";
import type { Report } from "@/lib/types";
import { Card, ErrorBox, PageHeader, Spinner } from "@/components/ui";
import { runComparison } from "@/store/comparisonSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function CompareInner() {
  const dispatch = useAppDispatch();
  const sp = useSearchParams();
  const { a, b, loading, error } = useAppSelector((s) => s.comparison);
  const [ua, setUa] = useState(sp.get("a") ?? "");
  const [ub, setUb] = useState(sp.get("b") ?? "");
  const autoRan = useRef(false);

  useEffect(() => {
    if (!autoRan.current && sp.get("a") && sp.get("b")) {
      autoRan.current = true;
      dispatch(runComparison({ a: sp.get("a")!, b: sp.get("b")! }));
    }
  }, [sp, dispatch]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(runComparison({ a: ua, b: ub }));
  }

  const rows = a && b ? buildComparison(a.analysis, b.analysis) : [];
  const winsA = rows.filter((r) => r.winner === "a").length;
  const winsB = rows.filter((r) => r.winner === "b").length;

  return (
    <>
      <PageHeader title="Compare Developers" subtitle="Enter two GitHub profiles to compare them category by category" />
      <Card className="mb-6">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="label">Developer A</label>
            <input className="input" required value={ua} onChange={(e) => setUa(e.target.value)} placeholder="https://github.com/username" />
          </div>
          <div>
            <label className="label">Developer B</label>
            <input className="input" required value={ub} onChange={(e) => setUb(e.target.value)} placeholder="https://github.com/username" />
          </div>
          <button className="btn" disabled={loading}>
            {loading ? "Comparing…" : "Compare"}
          </button>
        </form>
      </Card>

      <ErrorBox message={error} />
      {loading && !a && <Spinner label="Fetching both profiles…" />}

      {a && b && (
        <Card>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-slate-800 pb-5 text-center">
            <Dev r={a} wins={winsA} />
            <span className="text-sm text-slate-500">vs</span>
            <Dev r={b} wins={winsB} />
          </div>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-slate-800/70 last:border-0">
                  <td className={`w-1/3 py-3 text-center text-base ${r.winner === "a" ? "font-bold text-emerald-400" : "text-slate-300"}`}>
                    {r.a}
                    {r.suffix}
                    {r.winner === "a" && " ✓"}
                  </td>
                  <td className="py-3 text-center text-xs uppercase tracking-wide text-slate-500">{r.label}</td>
                  <td className={`w-1/3 py-3 text-center text-base ${r.winner === "b" ? "font-bold text-emerald-400" : "text-slate-300"}`}>
                    {r.b}
                    {r.suffix}
                    {r.winner === "b" && " ✓"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function Dev({ r, wins }: { r: Report; wins: number }) {
  const p = r.analysis.profile;
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.avatar} alt={p.username} className="mx-auto h-16 w-16 rounded-full border border-slate-700" />
      <div className="mt-2 font-semibold text-slate-100">{p.name || p.username}</div>
      <div className="text-xs text-slate-500">@{p.username}</div>
      <div className="mt-1 text-xs text-emerald-400">
        {wins} {wins === 1 ? "category" : "categories"} won
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CompareInner />
    </Suspense>
  );
}
