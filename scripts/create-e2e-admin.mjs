#!/usr/bin/env node
// Provisions the synthetic `admin`-role e2e fixture account (Phase 7,
// phase7.md §6) - mirrors how the `staff` fixture
// (e2e-tests@forkstock.dev) was created in Phase 1, so admin-only
// workflows (soft-delete, catalogue/warehouse management) can finally be
// exercised end-to-end instead of only unit/component-tested.
//
// Usage: node scripts/create-e2e-admin.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (.env.local).
//
// Safe to re-run: creates the auth user only if it doesn't already
// exist, and always (re-)confirms its profile row has role='admin'.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

if (fs.existsSync(path.join(repoRoot, ".env.local"))) {
  process.loadEnvFile(path.join(repoRoot, ".env.local"));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local",
  );
  process.exit(1);
}

const EMAIL = "e2e-admin@forkstock.dev";
const PASSWORD = process.env.E2E_ADMIN_TEST_PASSWORD ?? crypto.randomUUID();

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  // Admin API is paginated; the project has a handful of users, so one
  // page is enough - not worth a search loop for this fixed, tiny scale.
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data.users.find((u) => u.email === email) ?? null;
}

async function main() {
  let user = await findUserByEmail(EMAIL);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "E2E Admin Fixture" },
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created auth user ${EMAIL} (${user.id})`);
  } else {
    console.log(`Auth user ${EMAIL} already exists (${user.id})`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin", full_name: "E2E Admin Fixture" })
    .eq("id", user.id);
  if (profileError) throw profileError;
  console.log(`Confirmed profile role=admin for ${EMAIL}`);

  console.log("\nAdd these to .env.local (and the CI secrets store):");
  console.log(`E2E_ADMIN_TEST_EMAIL=${EMAIL}`);
  if (!process.env.E2E_ADMIN_TEST_PASSWORD) {
    console.log(`E2E_ADMIN_TEST_PASSWORD=${PASSWORD}`);
  } else {
    console.log("E2E_ADMIN_TEST_PASSWORD=<unchanged - already set>");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
