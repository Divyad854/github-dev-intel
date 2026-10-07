"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchMe, logout } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Spinner } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyze", label: "Analyze GitHub" },
  { href: "/history", label: "My Analyses" },
  { href: "/saved", label: "Saved Profiles" },
  { href: "/compare", label: "Compare Developers" },
  { href: "/repositories", label: "Repositories" },
  { href: "/settings", label: "Profile" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, status } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!user && status === "idle") dispatch(fetchMe());
  }, [user, status, dispatch]);

  useEffect(() => {
    if (!user && status === "ready") router.replace("/login");
  }, [user, status, router]);

  if (!user) return <Spinner label="Checking session…" />;

  const items = user.role === "admin" ? [...NAV, { href: "/admin", label: "Admin" }] : NAV;

  async function onLogout() {
    await dispatch(logout());
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-800 bg-slate-900/60 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <Link href="/dashboard" className="text-lg font-bold text-emerald-400">
            🐙 DevIntel
          </Link>
          <button onClick={onLogout} className="text-sm text-slate-400 hover:text-white md:hidden">
            Logout
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {items.map((i) => {
            const active = pathname === i.href || pathname.startsWith(i.href + "/");
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-emerald-500/15 font-semibold text-emerald-300" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {i.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 hidden border-t border-slate-800 px-5 py-4 md:block">
          <div className="truncate text-sm font-medium text-slate-200">{user.name}</div>
          <div className="truncate text-xs text-slate-500">{user.email}</div>
          <button onClick={onLogout} className="btn-ghost mt-3 w-full">
            Logout
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
