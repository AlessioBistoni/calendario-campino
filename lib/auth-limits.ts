import { headers } from "next/headers";
import { digest } from "./auth";
import { db } from "./db";

export async function allowPasswordAttempt(username: string) {
  // Vercel overwrites this header at its edge. Local development shares one bucket.
  const ip = process.env.VERCEL === "1"
    ? (await headers()).get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    : "local";
  const limits = [
    { key: digest(`auth-ip:${ip}`), maximum: 30 },
    { key: digest(`auth-account:${username.toLowerCase()}`), maximum: 8 },
  ].sort((a, b) => a.key.localeCompare(b.key));

  await db().query("DELETE FROM login_limits WHERE window_started_at <= now() - interval '15 minutes'");
  const result = await db().query<{ client_hash: string; attempts: number }>(
    `INSERT INTO login_limits (client_hash, attempts, window_started_at)
     VALUES ($1, 1, now()), ($2, 1, now())
     ON CONFLICT (client_hash) DO UPDATE SET
       attempts = CASE WHEN login_limits.window_started_at <= now() - interval '15 minutes'
                       THEN 1 ELSE least(login_limits.attempts + 1, 31) END,
       window_started_at = CASE WHEN login_limits.window_started_at <= now() - interval '15 minutes'
                                THEN now() ELSE login_limits.window_started_at END
     RETURNING client_hash, attempts`,
    limits.map((limit) => limit.key),
  );
  return result.rows.every((row) => row.attempts <= limits.find((limit) => limit.key === row.client_hash)!.maximum);
}
