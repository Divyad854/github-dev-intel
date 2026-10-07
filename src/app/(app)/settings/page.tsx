"use client";

import { useState } from "react";
import { Card, ErrorBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/types";
import { setUser } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [name, setName] = useState(user?.name ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save(body: Record<string, string>, ok: string) {
    setMsg(null);
    setErr(null);
    try {
      const { user: u } = await api<{ user: AuthUser }>("/api/auth/me", { method: "PATCH", body });
      dispatch(setUser(u));
      setMsg(ok);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account" />
      <div className="grid max-w-3xl gap-6">
        <Card title="Account">
          <div className="mb-4 text-sm text-slate-400">
            {user?.email} · role: <span className="text-slate-200">{user?.role}</span>
          </div>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save({ name }, "Name updated");
            }}
          >
            <div className="flex-1">
              <label className="label">Display name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
            </div>
            <button className="btn">Save name</button>
          </form>
        </Card>

        <Card title="Change password">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save({ currentPassword: current, newPassword: next }, "Password changed");
              setCurrent("");
              setNext("");
            }}
          >
            <div>
              <label className="label">Current password</label>
              <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div>
              <label className="label">New password (min 8)</label>
              <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required />
            </div>
            <div className="sm:col-span-2">
              <button className="btn">Update password</button>
            </div>
          </form>
        </Card>

        <ErrorBox message={err} />
        {msg && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{msg}</div>}
      </div>
    </>
  );
}
