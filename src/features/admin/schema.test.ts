import { describe, expect, it } from "vitest";

import { inviteUserSchema, updateRoleSchema } from "@/features/admin/schema";

describe("inviteUserSchema", () => {
  it("requires a name, a valid email, and a valid role", () => {
    expect(
      inviteUserSchema.safeParse({
        fullName: "Priya Shah",
        email: "priya@example.com",
        role: "manager",
      }).success,
    ).toBe(true);

    expect(
      inviteUserSchema.safeParse({
        fullName: "",
        email: "priya@example.com",
        role: "manager",
      }).success,
    ).toBe(false);

    expect(
      inviteUserSchema.safeParse({
        fullName: "Priya Shah",
        email: "not-an-email",
        role: "manager",
      }).success,
    ).toBe(false);

    expect(
      inviteUserSchema.safeParse({
        fullName: "Priya Shah",
        email: "priya@example.com",
        role: "owner",
      }).success,
    ).toBe(false);
  });
});

describe("updateRoleSchema", () => {
  it("only accepts a known role", () => {
    expect(updateRoleSchema.safeParse({ role: "admin" }).success).toBe(true);
    expect(updateRoleSchema.safeParse({ role: "superuser" }).success).toBe(
      false,
    );
  });
});
