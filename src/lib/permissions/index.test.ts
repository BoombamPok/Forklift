import { describe, expect, it } from "vitest";

import { can, ROLES } from "@/lib/permissions";

describe("can", () => {
  it("grants admins every permission", () => {
    expect(can("admin", "users.manage")).toBe(true);
    expect(can("admin", "settings.manage")).toBe(true);
    expect(can("admin", "inventory.delete")).toBe(true);
  });

  it("keeps users.manage and settings.manage admin-only", () => {
    for (const role of ROLES) {
      if (role === "admin") continue;
      expect(can(role, "users.manage")).toBe(false);
      expect(can(role, "settings.manage")).toBe(false);
    }
  });

  it("lets staff record movements but not delete inventory", () => {
    expect(can("staff", "inventory.adjust")).toBe(true);
    expect(can("staff", "inventory.transfer")).toBe(true);
    expect(can("staff", "inventory.delete")).toBe(false);
  });

  it("keeps read_only to view permissions across the board", () => {
    expect(can("read_only", "inventory.view")).toBe(true);
    expect(can("read_only", "inventory.create")).toBe(false);
    expect(can("read_only", "catalogue.manage")).toBe(false);
  });
});
