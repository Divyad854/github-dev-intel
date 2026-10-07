"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ErrorBox } from "@/components/ui";
import { clearAuthError, login } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { error, status } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(clearAuthError());
    const res = await dispatch(login({ email, password }));
    if (login.fulfilled.match(res)) {
      const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      router.replace(safe);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="text-4xl">🐙</div>
          <h1 className="mt-2 text-xl font-bold text-slate-100">GitHub Developer Intelligence</h1>
          <p className="text-sm text-slate-400">Sign in to your account</p>
        </div>
        <ErrorBox message={error} />
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn w-full" disabled={status === "loading"}>
          {status === "loading" ? "Signing in…" : "Login"}
        </button>
        <p className="text-center text-sm text-slate-400">
          No account?{" "}
          <Link href="/register" className="text-emerald-400 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
