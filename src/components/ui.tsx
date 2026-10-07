import type { LanguageStat } from "@/lib/types";

const PALETTE = ["#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#fb7185", "#2dd4bf", "#f97316"];

export function langColor(name: string): string {
  if (name === "Other") return "#64748b";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function fmtDate(iso: string, withYear = false): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function scoreColor(v: number): string {
  if (v >= 75) return "bg-emerald-500";
  if (v >= 50) return "bg-sky-500";
  if (v >= 30) return "bg-amber-500";
  return "bg-rose-500";
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-slate-100">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${scoreColor(value)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function LanguageBar({ languages }: { languages: LanguageStat[] }) {
  if (!languages.length) return <p className="text-sm text-slate-500">No language data found.</p>;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-800">
        {languages.map((l) => (
          <div
            key={l.language}
            title={`${l.language} ${l.percent}%`}
            style={{ width: `${l.percent}%`, background: langColor(l.language) }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {languages.map((l) => (
          <li key={l.language} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: langColor(l.language) }} />
              {l.language}
            </span>
            <span className="text-slate-400">
              {l.count} {l.count === 1 ? "repo" : "repos"} · <span className="text-slate-200">{l.percent}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-950/60 px-4 py-3">
      <div className="text-xl font-bold text-slate-100">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
      {label}
    </div>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
      {message}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
