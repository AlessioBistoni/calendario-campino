import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const parameters = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const prefix = "scrypt-v2";

// Unknown usernames still perform a full password derivation.
export const dummyPasswordHash = `${prefix}:${"0".repeat(32)}:${"0".repeat(128)}`;

export function validUsername(username) {
  return /^[a-zA-Z0-9._-]{3,40}$/.test(username);
}

export function validPassword(password) {
  return password.length > 0 && password.length <= 128;
}

export function needsPasswordUpgrade(storedHash) {
  return !storedHash.startsWith(`${prefix}:`);
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, 64, parameters);
  return `${prefix}:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  const modern = storedHash.startsWith(`${prefix}:`);
  const parts = storedHash.split(":");
  const [salt, key] = modern ? parts.slice(1) : parts;
  if (parts.length !== (modern ? 3 : 2) || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(key ?? "")) return false;
  const actual = modern
    ? await derive(password, salt, 64, parameters)
    : await derive(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(key, "hex"));
}
