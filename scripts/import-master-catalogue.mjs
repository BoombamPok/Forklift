#!/usr/bin/env node
// One-time import of supabase/reference-data/godrej-voltas-master-catalogue.csv
// (284 real parts / 2 brands / 9 models / 979 compatibility links, per
// phase1.md #5) into the catalogue tables. Real business data, sourced
// from actual Godrej/Voltas OEM parts catalogues - not invented.
//
// Usage: node scripts/import-master-catalogue.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (.env.local).
//
// Safe to re-run: parts/cross-refs are skipped if a matching row already
// exists; brands/categories/sources/models/compatibility/part-sources use
// their real unique constraints via upsert.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Minimal RFC4180 CSV parser (quoted fields, embedded commas, "" escapes) ---
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((r) =>
    Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])),
  );
}

const csvPath = path.join(
  repoRoot,
  "supabase/reference-data/godrej-voltas-master-catalogue.csv",
);
const records = parseCsv(fs.readFileSync(csvPath, "utf-8"));
console.log(`Parsed ${records.length} catalogue_parts rows from CSV.`);

function splitList(value) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

// confidence A/B/C -> our verification_status, per docs/decisions (A is the
// only value present in this dataset; B/C are a documented best guess for
// when a larger dataset introduces them).
const CONFIDENCE_MAP = { A: "verified", B: "uncertain", C: "unverified" };

async function upsert(table, rows, onConflict) {
  if (rows.length === 0) return [];
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict })
    .select();
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  return data;
}

async function main() {
  // 1. Brands
  const brandNames = [...new Set(records.map((r) => r.brand))];
  const brands = await upsert(
    "brands",
    brandNames.map((name) => ({ name })),
    "name",
  );
  const brandIdByName = new Map(brands.map((b) => [b.name, b.id]));
  console.log(`Brands: ${brands.length}`);

  // 2. Categories
  const categoryNames = [...new Set(records.map((r) => r.category))];
  const categories = await upsert(
    "categories",
    categoryNames.map((name) => ({ name })),
    "name",
  );
  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));
  console.log(`Categories: ${categories.length}`);

  // 3. Sources (a row's source_catalogue can list more than one, comma-joined)
  const sourceNames = new Set();
  for (const r of records)
    for (const s of splitList(r.source_catalogue)) sourceNames.add(s);
  const sources = await upsert(
    "catalogue_sources",
    [...sourceNames].map((name) => ({ name })),
    "name",
  );
  const sourceIdByName = new Map(sources.map((s) => [s.name, s.id]));
  console.log(`Sources: ${sources.length}`);

  // 4. Models - derive brand + fuel_type per model from the rows that
  // reference it (both are consistent per model in this dataset).
  const modelInfo = new Map();
  for (const r of records) {
    for (const m of splitList(r.fits_models)) {
      if (!modelInfo.has(m))
        modelInfo.set(m, { brand: r.brand, fuel_type: r.fuel_types });
    }
  }
  const models = await upsert(
    "catalogue_models",
    [...modelInfo.entries()].map(([name, info]) => ({
      name,
      brand_id: brandIdByName.get(info.brand),
      fuel_type: info.fuel_type || null,
    })),
    "brand_id,name",
  );
  const modelIdByName = new Map(models.map((m) => [m.name, m.id]));
  console.log(`Models: ${models.length}`);

  // 5. Parts - skip any (brand_id, part_number) pair already imported, so
  // re-running this script doesn't create duplicates.
  const { data: existingParts, error: existingErr } = await supabase
    .from("catalogue_parts")
    .select("brand_id, part_number");
  if (existingErr) throw new Error(existingErr.message);
  const existingKey = new Set(
    existingParts.map((p) => `${p.brand_id}::${p.part_number}`),
  );

  const partsToInsert = [];
  for (const r of records) {
    const brand_id = brandIdByName.get(r.brand);
    const key = `${brand_id}::${r.part_number}`;
    if (existingKey.has(key)) continue;
    partsToInsert.push({
      part_number: r.part_number,
      name: r.part_name,
      brand_id,
      category_id: categoryIdByName.get(r.category),
      sub_category: r.sub_category || null,
      assembly_group: r.assembly_group || null,
      is_fastener: r.is_fastener === "1",
      capacity_range_kg: r.capacity_range_kg || null,
      verification_status: CONFIDENCE_MAP[r.confidence] ?? "unverified",
    });
  }
  let insertedParts = [];
  if (partsToInsert.length > 0) {
    const { data, error } = await supabase
      .from("catalogue_parts")
      .insert(partsToInsert)
      .select();
    if (error)
      throw new Error(`catalogue_parts insert failed: ${error.message}`);
    insertedParts = data;
  }
  console.log(
    `Parts inserted this run: ${insertedParts.length} (${existingKey.size} already existed)`,
  );

  // Re-fetch the full id map (covers rows from a previous run too).
  const { data: allParts, error: allPartsErr } = await supabase
    .from("catalogue_parts")
    .select("id, brand_id, part_number");
  if (allPartsErr) throw new Error(allPartsErr.message);
  const partIdByKey = new Map(
    allParts.map((p) => [`${p.brand_id}::${p.part_number}`, p.id]),
  );

  // 6. Compatibility (part <-> model)
  const compatRows = [];
  for (const r of records) {
    const partId = partIdByKey.get(
      `${brandIdByName.get(r.brand)}::${r.part_number}`,
    );
    for (const m of splitList(r.fits_models)) {
      compatRows.push({
        catalogue_part_id: partId,
        catalogue_model_id: modelIdByName.get(m),
        verification_status: CONFIDENCE_MAP[r.confidence] ?? "unverified",
      });
    }
  }
  const compat = await upsert(
    "compatibility",
    compatRows,
    "catalogue_part_id,catalogue_model_id",
  );
  console.log(`Compatibility links: ${compat.length}`);

  // 7. Part <-> source links
  const partSourceRows = [];
  for (const r of records) {
    const partId = partIdByKey.get(
      `${brandIdByName.get(r.brand)}::${r.part_number}`,
    );
    for (const s of splitList(r.source_catalogue)) {
      partSourceRows.push({
        catalogue_part_id: partId,
        source_id: sourceIdByName.get(s),
      });
    }
  }
  const partSources = await upsert(
    "catalogue_part_sources",
    partSourceRows,
    "catalogue_part_id,source_id",
  );
  console.log(`Part<->source links: ${partSources.length}`);

  // 8. Cross references - only where a real code follows the source name
  // ("HYDAX -" etc. means the code itself isn't known, so there's nothing
  // to record - CLAUDE.md #13 on not inventing missing data).
  const { data: existingCrossRefs, error: crErr } = await supabase
    .from("cross_refs")
    .select("catalogue_part_id, cross_reference_number");
  if (crErr) throw new Error(crErr.message);
  const existingCrossRefKey = new Set(
    existingCrossRefs.map(
      (c) => `${c.catalogue_part_id}::${c.cross_reference_number}`,
    ),
  );

  const crossRefRows = [];
  for (const r of records) {
    const raw = r.cross_references.trim();
    if (!raw) continue;
    const spaceIdx = raw.indexOf(" ");
    if (spaceIdx === -1) continue;
    const source = raw.slice(0, spaceIdx);
    const code = raw.slice(spaceIdx + 1).trim();
    if (!code || code === "-") continue;
    const partId = partIdByKey.get(
      `${brandIdByName.get(r.brand)}::${r.part_number}`,
    );
    const key = `${partId}::${code}`;
    if (existingCrossRefKey.has(key)) continue;
    crossRefRows.push({
      catalogue_part_id: partId,
      cross_reference_number: code,
      source,
    });
  }
  let insertedCrossRefs = [];
  if (crossRefRows.length > 0) {
    const { data, error } = await supabase
      .from("cross_refs")
      .insert(crossRefRows)
      .select();
    if (error) throw new Error(`cross_refs insert failed: ${error.message}`);
    insertedCrossRefs = data;
  }
  console.log(`Cross-references inserted: ${insertedCrossRefs.length}`);

  console.log("Import complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
