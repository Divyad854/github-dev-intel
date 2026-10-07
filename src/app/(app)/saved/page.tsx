"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, ErrorBox, PageHeader, Spinner, fmtDate } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadSaved, removeSaved, saveProfile } from "@/store/savedProfilesSlice";
import { extractUsername } from "@/lib/username";

export default function SavedPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items, loading, error } = useAppSelector((s) => s.savedProfiles);
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(loadSaved());
  }, [dispatch]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const u = extractUsername(input);
    if (!u) return;
    setBusy(true);
    await dispatch(saveProfile(u));
    setBusy(false);
    setInput("");
  }

  function toggle(u: string) {
    setPicked((p) => (p.includes(u) ? p.filter((x) => x !== u) : [...p, u].slice(-2)));
  }

  return (
    <>
      <PageHeader title="Saved Profiles" subtitle="Developers you want to monitor or compare later">
        {picked.length === 2 && (
          <button className="btn" onClick={() => router.push(`/compare?a=${picked[0]}&b=${picked[1]}`)}>
            Compare selected
          </button>
        )}
      </PageHeader>

      <Card className="mb-6">
        <form onSubmit={add} className="flex flex-wrap gap-3">
          <input
            className="input max-w-md flex-1"
            placeholder="GitHub URL or username to save"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn" disabled={busy || !extractUsername(input)}>
            {busy ? "Saving…" : "Save"}
          </button>
        </form>
      </Card>

      <ErrorBox message={error} />
      {loading && !items.length ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No saved developers yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div key={i.username} className="card">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={picked.includes(i.username)}
                  onChange={() => toggle(i.username)}
                  title="Select two to compare"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.avatar} alt="" className="h-10 w-10 rounded-full" />
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-100">✓ {i.username}</div>
                  <div className="truncate text-xs text-slate-500">
                    {i.name ? `${i.name} · ` : ""}saved {fmtDate(i.savedAt)}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3 text-sm">
                <Link href={`/profile/${i.username}`} className="text-emerald-400 hover:underline">
                  View
                </Link>
                <Link href={`/repositories?username=${i.username}`} className="text-slate-300 hover:underline">
                  Repos
                </Link>
                <button onClick={() => dispatch(removeSaved(i.username))} className="ml-auto text-slate-500 hover:text-rose-400">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
