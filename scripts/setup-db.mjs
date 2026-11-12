import { readFile } from "node:fs/promises";
import pg from "pg";
import { hashPassword, validPassword, validUsername } from "../lib/password.mjs";

const { DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
if (!DATABASE_URL) throw new Error("Imposta DATABASE_URL.");

const client = new pg.Client({ connectionString: DATABASE_URL });
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(53800921)");
  await client.query(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));
  const existing = await client.query("SELECT 1 FROM accounts LIMIT 1");
  if (!existing.rowCount) {
    if (!validUsername(ADMIN_USERNAME ?? "") || !validPassword(ADMIN_PASSWORD ?? "")) {
      throw new Error("Imposta ADMIN_USERNAME e ADMIN_PASSWORD (obbligatoria, massimo 128 caratteri).");
    }
    await client.query(
      "INSERT INTO accounts (username, password_hash) VALUES ($1, $2)",
      [ADMIN_USERNAME, await hashPassword(ADMIN_PASSWORD)],
    );
  }
  await client.query("COMMIT");
  console.log("Database pronto.");
} finally {
  await client.end();
}
