import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { toCsv } from "@/lib/csv";

const HEADERS = [
  "part_number",
  "name",
  "brand",
  "category",
  "sub_category",
  "assembly_group",
  "is_fastener",
  "capacity_range_kg",
  "oem_reference",
  "description",
  "verification_status",
];

export async function GET() {
  await requireRole("users.manage");

  const supabase = await createClient();
  const [{ data: parts, error: partsError }, brandsRes, categoriesRes] =
    await Promise.all([
      supabase
        .from("catalogue_parts")
        .select(
          "part_number, name, brand_id, category_id, sub_category, assembly_group, is_fastener, capacity_range_kg, oem_reference, description, verification_status",
        )
        .is("deleted_at", null)
        .order("part_number"),
      supabase.from("brands").select("id, name"),
      supabase.from("categories").select("id, name"),
    ]);

  if (partsError) {
    return new Response("Failed to export catalogue parts.", { status: 500 });
  }

  const brandNameById = new Map(
    (brandsRes.data ?? []).map((b) => [b.id, b.name]),
  );
  const categoryNameById = new Map(
    (categoriesRes.data ?? []).map((c) => [c.id, c.name]),
  );

  const rows = (parts ?? []).map((p) => ({
    part_number: p.part_number,
    name: p.name,
    brand: p.brand_id ? (brandNameById.get(p.brand_id) ?? "") : "",
    category: p.category_id ? (categoryNameById.get(p.category_id) ?? "") : "",
    sub_category: p.sub_category ?? "",
    assembly_group: p.assembly_group ?? "",
    is_fastener: p.is_fastener ? "1" : "0",
    capacity_range_kg: p.capacity_range_kg ?? "",
    oem_reference: p.oem_reference ?? "",
    description: p.description ?? "",
    verification_status: p.verification_status,
  }));

  const csv = toCsv(rows, HEADERS);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="catalogue-parts.csv"',
    },
  });
}
