"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, ErrorBox, PageHeader } from "@/components/ui";
import { analyzeProfile, clearGithubError } from "@/store/githubSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function AnalyzePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((s) => s.github);
  const [url, setUrl] = useState("");
  const [refresh, setRefresh] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(clearGithubError());
    const res = await dispatch(analyzeProfile({ url, refresh }));
    if (analyzeProfile.fulfilled.match(res)) {
      const r = res.payload;
      router.push(`/profile/${r.analysis.profile.username}?report=${r.id}`);
    }
  }

  return (
    <>
      <PageHeader title="Analyze GitHub" subtitle="Paste a GitHub profile URL (or just a username)" />
      <Card className="max-w-2xl">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">GitHub profile URL</label>
            <input
              className="input"
              placeholder="https://github.com/username"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={refresh} onChange={(e) => setRefresh(e.target.checked)} />
            Force fresh data from GitHub (otherwise results from the last 10 minutes come from MongoDB)
          </label>
          <ErrorBox message={error} />
          <button className="btn" disabled={loading}>
            {loading ? "Analyzing…" : "Analyze developer"}
          </button>
        </form>
      </Card>
    </>
  );
}
