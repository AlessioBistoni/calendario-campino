import { Pool } from "pg";

const globalDb = globalThis as typeof globalThis & { campinoPool?: Pool };

export function db() {
  if (!globalDb.campinoPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL mancante");
    const url = new URL(connectionString);
    if (process.env.VERCEL === "1") url.searchParams.set("sslmode", "verify-full");
    globalDb.campinoPool = new Pool({
      connectionString: url.toString(),
      max: 3,
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
    });
    globalDb.campinoPool.on("error", (error) => console.error("Connessione PostgreSQL", error.name));
  }
  return globalDb.campinoPool;
}
