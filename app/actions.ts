"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, digest, endSession, requireAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { todayInRome, validDate } from "@/lib/dates";
import { hashPassword, validPassword, validUsername, verifyPassword } from "@/lib/password.mjs";

export type FormState = { error?: string; success?: string; booking?: { name: string; day: string } };

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export async function book(_state: FormState, form: FormData): Promise<FormState> {
  const account = await requireAccount();
  const name = field(form, "name").trim().replace(/\s+/gu, " ");
  const day = field(form, "day");
  if (name.length < 2 || name.length > 80 || /[\p{Cc}\p{Cf}]/u.test(name)) {
    return { error: "Inserisci un nome valido da 2 a 80 caratteri." };
  }
  if (!validDate(day) || day < todayInRome()) return { error: "Scegli una data da oggi in poi." };
  try {
    const result = await db().query(
      `INSERT INTO bookings (name, booked_date)
       SELECT $1, $2::date FROM accounts WHERE id = $3 AND revision = $4
       ON CONFLICT (booked_date) DO NOTHING`,
      [name, day, account.id, account.revision],
    );
    if (!result.rowCount) return { error: "Data non disponibile. Scegli un altro giorno o accedi di nuovo." };
  } catch (error) {
    console.error("Salvataggio prenotazione", error instanceof Error ? error.name : "Errore");
    return { error: "Salvataggio non riuscito. Riprova tra poco." };
  }
  revalidatePath("/gestione");
  return { booking: { name, day } };
}

export async function signIn(_state: FormState, form: FormData): Promise<FormState> {
  const username = field(form, "username").trim();
  const password = field(form, "password");
  const invalid = { error: "Nome utente o password non validi." };
  if (!validUsername(username) || !password || password.length > 128) return invalid;

  const client = (await headers()).get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "local";
  try {
    const limit = await db().query<{ attempts: number }>(
      `INSERT INTO login_limits (client_hash, attempts, window_started_at) VALUES ($1, 1, now())
       ON CONFLICT (client_hash) DO UPDATE SET
         attempts = CASE WHEN login_limits.window_started_at <= now() - interval '15 minutes'
                         THEN 1 ELSE least(login_limits.attempts + 1, 9) END,
         window_started_at = CASE WHEN login_limits.window_started_at <= now() - interval '15 minutes'
                                  THEN now() ELSE login_limits.window_started_at END
       RETURNING attempts`,
      [digest(client)],
    );
    if (limit.rows[0].attempts > 8) return { error: "Troppi tentativi. Riprova tra 15 minuti." };

    const result = await db().query<{ username: string; password_hash: string; revision: number; id: string }>(
      "SELECT username, password_hash, revision, id FROM accounts ORDER BY (username = $1) DESC LIMIT 1",
      [username],
    );
    const account = result.rows[0];
    if (!account) return { error: "Accesso non configurato. Inizializza il database." };
    const valid = await verifyPassword(password, account.password_hash);
    if (!valid || account.username !== username) return invalid;
    await db().query("DELETE FROM login_limits WHERE client_hash = $1 OR window_started_at <= now() - interval '15 minutes'", [digest(client)]);
    await createSession(account.id, account.revision);
  } catch (error) {
    console.error("Accesso Campino", error instanceof Error ? error.name : "Errore");
    return { error: "Accesso non disponibile. Riprova tra poco." };
  }
  redirect("/");
}

export async function signOut() {
  await endSession();
  redirect("/accesso");
}

export async function updateCredentials(_state: FormState, form: FormData): Promise<FormState> {
  const account = await requireAccount();
  const username = field(form, "username").trim();
  const password = field(form, "password");
  const currentPassword = field(form, "currentPassword");
  if (!validUsername(username)) return { error: "Usa 3–40 caratteri tra lettere, numeri, punti, trattini e underscore." };
  if (password && !validPassword(password)) return { error: "La nuova password deve contenere da 12 a 128 caratteri." };
  if (!currentPassword || currentPassword.length > 128) return { error: "La password attuale non è corretta." };
  const result = await db().query<{ password_hash: string }>(
    "SELECT password_hash FROM accounts WHERE id = $1 AND revision = $2", [account.id, account.revision],
  );
  const existing = result.rows[0]?.password_hash;
  if (!existing || !(await verifyPassword(currentPassword, existing))) return { error: "La password attuale non è corretta." };
  try {
    const updated = await db().query(
      "UPDATE accounts SET username = $1, password_hash = $2, revision = revision + 1 WHERE id = $3 AND revision = $4",
      [username, password ? await hashPassword(password) : existing, account.id, account.revision],
    );
    if (!updated.rowCount) return { error: "Account modificato. Accedi di nuovo." };
  } catch {
    return { error: "Salvataggio non riuscito. Verifica che il nome utente sia disponibile." };
  }
  await endSession();
  redirect("/accesso?aggiornato=1");
}

export async function addMember(_state: FormState, form: FormData): Promise<FormState> {
  const account = await requireAccount();
  const username = field(form, "username").trim();
  const password = field(form, "password");
  if (!validUsername(username)) return { error: "Usa 3–40 caratteri tra lettere, numeri, punti, trattini e underscore." };
  if (!validPassword(password)) return { error: "La password deve contenere da 12 a 128 caratteri." };
  try {
    const result = await db().query(
      `INSERT INTO accounts (username, password_hash)
       SELECT $1, $2 FROM accounts WHERE id = $3 AND revision = $4
       ON CONFLICT (username) DO NOTHING RETURNING id`,
      [username, await hashPassword(password), account.id, account.revision],
    );
    if (!result.rowCount) return { error: "Nome utente già in uso oppure sessione scaduta." };
  } catch {
    return { error: "Creazione non riuscita. Riprova." };
  }
  revalidatePath("/gestione/credenziali");
  return { success: "Membro aggiunto." };
}

export async function deleteMember(id: string, _state: FormState, _form: FormData): Promise<FormState> {
  const account = await requireAccount();
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id)) return { error: "Account non valido." };
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(53800921)");
    const active = await client.query("SELECT 1 FROM accounts WHERE id = $1 AND revision = $2 FOR UPDATE", [account.id, account.revision]);
    if (!active.rowCount) {
      await client.query("ROLLBACK");
      return { error: "Sessione scaduta. Accedi di nuovo." };
    }
    const count = await client.query<{ count: number }>("SELECT count(*)::int AS count FROM accounts");
    if (count.rows[0].count <= 1) {
      await client.query("ROLLBACK");
      return { error: "Deve rimanere almeno un membro per accedere alla webapp." };
    }
    await client.query("DELETE FROM accounts WHERE id = $1", [id]);
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    return { error: "Eliminazione non riuscita. Riprova." };
  } finally {
    client.release();
  }
  if (id === account.id) {
    await endSession();
    redirect("/accesso");
  }
  revalidatePath("/gestione/credenziali");
  return { success: "Membro eliminato." };
}

export async function setPayment(id: string, paid: boolean) {
  const account = await requireAccount();
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id) || typeof paid !== "boolean") return;
  await db().query(
    `UPDATE bookings SET paid_at = CASE WHEN $2 THEN coalesce(paid_at, now()) ELSE NULL END
     WHERE id = $1 AND EXISTS (SELECT 1 FROM accounts WHERE id = $3 AND revision = $4)`,
    [id, paid, account.id, account.revision],
  );
  revalidatePath("/gestione");
}

export async function deleteBooking(id: string, _state: FormState, _form: FormData): Promise<FormState> {
  const account = await requireAccount();
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id)) return { error: "Prenotazione non valida." };
  try {
    await db().query(
      `DELETE FROM bookings WHERE id = $1
       AND EXISTS (SELECT 1 FROM accounts WHERE id = $2 AND revision = $3)`,
      [id, account.id, account.revision],
    );
  } catch {
    return { error: "Eliminazione non riuscita. Riprova." };
  }
  revalidatePath("/gestione");
  return { success: "Prenotazione eliminata." };
}
