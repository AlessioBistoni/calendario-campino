import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

type Account = { username: string; revision: number; id: string };

const cookieName = process.env.NODE_ENV === "production" ? "__Host-campino_access" : "campino_access";
const sessionSeconds = 60 * 60 * 24 * 7;

export function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function currentAccount() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const result = await db().query<Account>(
    `SELECT accounts.username, accounts.revision, accounts.id
     FROM accounts JOIN sessions ON sessions.account_id = accounts.id AND sessions.revision = accounts.revision
     WHERE token_hash = $1 AND expires_at > now()`,
    [digest(token)],
  );
  return result.rows[0] ?? null;
}

export async function requireAccount() {
  const account = await currentAccount();
  if (!account) redirect("/accesso");
  return account;
}

export async function createSession(accountId: string, revision: number) {
  const jar = await cookies();
  const previous = jar.get(cookieName)?.value;
  const token = randomBytes(32).toString("hex");
  await db().query("DELETE FROM sessions WHERE expires_at <= now() OR token_hash = $1", [previous ? digest(previous) : null]);
  await db().query(
    "INSERT INTO sessions (token_hash, account_id, revision, expires_at) VALUES ($1, $2, $3, now() + interval '7 days')",
    [digest(token), accountId, revision],
  );
  jar.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionSeconds,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await db().query("DELETE FROM sessions WHERE token_hash = $1", [digest(token)]);
  jar.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
