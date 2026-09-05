import { AuthError } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { toErrorKind, toSafeErrorMessage } from "@/lib/errors";

// Both functions intentionally log the raw error server-side - silence
// that in test output rather than asserting on it.
vi.spyOn(console, "error").mockImplementation(() => {});

describe("toSafeErrorMessage", () => {
  it("gives a specific message for bad credentials without echoing Supabase's wording", () => {
    const error = new AuthError(
      "Invalid login credentials",
      400,
      "invalid_credentials",
    );
    expect(toSafeErrorMessage(error)).toBe(
      "That email or password is incorrect.",
    );
  });

  it("never leaks a raw Postgres error to the caller", () => {
    const pgError = {
      code: "23505",
      message: "duplicate key value violates unique constraint",
      details: "Key (name)=(Sample Brand A) already exists.",
      hint: null,
    };
    const message = toSafeErrorMessage(pgError);
    expect(message).not.toContain("constraint");
    expect(message).not.toContain("Key (name)");
  });

  it("falls back to a generic message for anything unrecognized", () => {
    expect(toSafeErrorMessage(new Error("boom"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});

describe("toErrorKind", () => {
  it("classifies a 403 AuthError as a permission error", () => {
    const error = new AuthError("Forbidden", 403, "forbidden");
    expect(toErrorKind(error)).toBe("permission");
  });

  it("classifies Postgres' not-found code as not-found", () => {
    expect(toErrorKind({ code: "PGRST116", message: "", details: "" })).toBe(
      "not-found",
    );
  });

  it("classifies Postgres' insufficient-privilege code as permission", () => {
    expect(toErrorKind({ code: "42501", message: "", details: "" })).toBe(
      "permission",
    );
  });

  it("falls back to unexpected for anything else", () => {
    expect(toErrorKind(new Error("boom"))).toBe("unexpected");
  });
});
