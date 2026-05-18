import "server-only";

export function hasInternalSecret(request: Request): boolean {
  const expected = [process.env.INTERNAL_API_SECRET, process.env.CRON_SECRET].filter(Boolean);
  if (expected.length === 0) return false;

  const auth = request.headers.get("authorization");
  if (expected.some((secret) => auth === `Bearer ${secret}`)) return true;

  const header = request.headers.get("x-internal-secret");
  return expected.includes(header ?? "");
}
