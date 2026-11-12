import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Comando fallito: ${command}`);
}

if (!process.env.DATABASE_URL) {
  const candidates = [
    process.env.POSTGRES_BIN,
    "/opt/homebrew/opt/postgresql@16/bin",
    "/usr/local/opt/postgresql@16/bin",
    "/usr/lib/postgresql/16/bin",
  ].filter(Boolean);
  const executable = spawnSync("which", ["pg_ctl"], { encoding: "utf8" });
  if (executable.status === 0) candidates.push(dirname(executable.stdout.trim()));
  const bin = candidates.find((path) => existsSync(join(path, "initdb")) && existsSync(join(path, "pg_ctl")));
  if (!bin) throw new Error("PostgreSQL locale non trovato. Installa PostgreSQL oppure imposta DATABASE_URL in .env.local.");

  const local = join(root, ".local");
  const data = join(local, "postgres");
  const projectId = createHash("sha256").update(root).digest("hex").slice(0, 12);
  const socket = join(tmpdir(), `campino-${projectId}`);
  mkdirSync(local, { recursive: true, mode: 0o700 });
  mkdirSync(socket, { recursive: true, mode: 0o700 });

  if (!existsSync(join(data, "PG_VERSION"))) {
    run(join(bin, "initdb"), ["-D", data, "-U", "campino", "-A", "trust", "--encoding=UTF8", "--no-locale"]);
  }
  const status = spawnSync(join(bin, "pg_ctl"), ["-D", data, "status"], { stdio: "ignore" });
  if (status.status !== 0) {
    run(join(bin, "pg_ctl"), [
      "-D", data, "-l", join(local, "postgres.log"),
      "-o", `-h '' -k '${socket.replaceAll("'", "'\\''")}' -p 5432`, "-w", "start",
    ]);
  }
  process.env.DATABASE_URL = `postgresql://campino@localhost/postgres?host=${encodeURIComponent(socket)}`;
  console.log("Database locale pronto. I dati sono conservati in .local/postgres.");
}

run(process.execPath, ["scripts/setup-db.mjs"], { env: process.env });
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => next.kill(signal));
}
next.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
next.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
