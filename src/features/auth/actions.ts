"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { toSafeErrorMessage, type ActionResult } from "@/lib/errors";
import { loginSchema, type LoginValues } from "@/features/auth/schema";

export async function login(values: LoginValues): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: "Check the highlighted fields." },
    };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return {
      success: false,
      error: { message: "Sign-in isn't configured yet." },
    };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase isn't configured yet - there's no session to sign out of.
  }
  redirect("/login");
}
