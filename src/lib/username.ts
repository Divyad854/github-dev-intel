/** Accepts https://github.com/user, github.com/user/repo, or a bare username. Safe for client and server. */
export function extractUsername(input: string): string | null {
  const t = (input || "").trim();
  const m = t.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})(?:[/?#].*)?$/i);
  if (m) return m[1];
  if (/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(t)) return t;
  return null;
}
