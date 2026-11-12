import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import test from "node:test";
import { hashPassword, needsPasswordUpgrade, validPassword, verifyPassword } from "../lib/password.mjs";

test("accepts short passwords, rejects empty and oversized values", () => {
  assert.equal(validPassword("a"), true);
  assert.equal(validPassword(""), false);
  assert.equal(validPassword("a".repeat(128)), true);
  assert.equal(validPassword("a".repeat(129)), false);
});

test("new hashes use independent salts and verify the correct password", async () => {
  const first = await hashPassword("a");
  const second = await hashPassword("a");
  assert.notEqual(first, second);
  assert.equal(needsPasswordUpgrade(first), false);
  assert.equal(await verifyPassword("a", first), true);
  assert.equal(await verifyPassword("b", first), false);
});

test("existing hashes remain valid until upgraded on successful login", async () => {
  const salt = "0123456789abcdef0123456789abcdef";
  const legacy = `${salt}:${scryptSync("existing-password", salt, 64).toString("hex")}`;
  assert.equal(needsPasswordUpgrade(legacy), true);
  assert.equal(await verifyPassword("existing-password", legacy), true);
  assert.equal(await verifyPassword("wrong-password", legacy), false);
});

test("malformed stored hashes fail without throwing", async () => {
  for (const hash of ["", "invalid", "scrypt-v2:x:y", "a".repeat(32) + ":00", "unknown:a:b"]) {
    assert.equal(await verifyPassword("a", hash), false);
  }
});
