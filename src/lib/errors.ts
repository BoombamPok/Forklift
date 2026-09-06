import { AuthError } from "@supabase/supabase-js";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * The error shapes screens must tell apart per CLAUDE.md's UX rules. Kept
 * here (not in the UI layer) since classifying an error is a data-access
 * concern - components/shared/error-state.tsx just renders whichever kind
 * it's given.
 */
export type ErrorKind = "permission" | "not-found" | "network" | "unexpected";

/** The one shape every Server Action returns - see lib/nav.ts's sibling
 * data-access modules and features/*\/actions.ts for usage. */
export type ActionResult<T> =
  { success: true; data: T } | { success: false; error: { message: string } };

/**
 * A Postgres unique-constraint violation (SQLSTATE 23505) - shared by
 * every feature action that wants a specific per-field message ("A
 * warehouse with this name already exists") instead of
 * `toSafeErrorMessage`'s generic "That already exists."
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "details" in error
  );
}

/**
 * Classifies a read-side failure (a query/RPC while loading a page or
 * section) into one of the kinds ErrorState knows how to present. Never
 * pass the raw error to the client - log it here and return the kind.
 */
export function toErrorKind(error: unknown): ErrorKind {
  console.error(error);

  if (error instanceof AuthError) {
    return error.status === 401 || error.status === 403
      ? "permission"
      : "unexpected";
  }

  if (isPostgrestError(error)) {
    if (error.code === "PGRST116") return "not-found";
    if (error.code === "42501") return "permission";
  }

  if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
    return "network";
  }

  return "unexpected";
}

/**
 * Turns a write-side failure (inside a Server Action) into the one safe
 * message a form/toast can show - never SQL, stack traces, or Supabase
 * internals, per CLAUDE.md #53.
 */
export function toSafeErrorMessage(error: unknown): string {
  console.error(error);

  if (error instanceof AuthError) {
    if (error.code === "invalid_credentials") {
      return "That email or password is incorrect.";
    }
    return "We couldn't sign you in. Please try again.";
  }

  if (isPostgrestError(error)) {
    if (error.code === "42501") {
      return "You don't have permission to do that.";
    }
    if (error.code === "23505") {
      return "That already exists.";
    }
  }

  return "Something went wrong. Please try again.";
}
