"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorBox } from "@/components/ui";
import { clearAuthError, register } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { error, status } = useAppSelector((s) => s.auth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(clearAuthError());
    const res = await dispatch(register({ name, email, password }));
    if (register.fulfilled.match(res)) router.replace("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="text-4xl">🐙</div>
          <h1 className="mt-2 text-xl font-bold text-slate-100">Create your account</h1>
          <p className="text-sm text-slate-400">Start analyzing GitHub developers</p>
        </div>
        <ErrorBox message={error} />
        <div>
          <label className="label">Name</label>
          <input className="input" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password (min 8 characters)</label>
          <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn w-full" disabled={status === "loading"}>
          {status === "loading" ? "Creating…" : "Register"}
        </button>
        <p className="text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
