import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

/**
 * Paths exempt from BOTH redirect rules below, unlike `PUBLIC_PATHS` which
 * is only exempt from the "must be logged in" rule. `/accept-invite` is
 * reached by clicking a Supabase invite email link, which logs the visitor
 * in automatically once the browser client processes the URL - so by the
 * time this page's own request lands, a session may already exist. If it
 * were merely a `PUBLIC_PATHS` entry, the "already logged in -> bounce to
 * /dashboard" rule would fire and the invitee would never see the
 * set-password form.
 */
const AUTH_FLOW_PATHS = ["/accept-invite"];

/**
 * Refreshes the Supabase session cookie on every request and redirects
 * unauthenticated visitors away from protected routes (CLAUDE.md #12).
 *
 * If NEXT_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY aren't set yet, this passes
 * every request through untouched instead of throwing - lets the shell
 * built in an earlier Phase 1 step stay browsable before a Supabase
 * project exists. Once real credentials are added (Phase 1 step 8-10)
 * this activates with no code change needed.
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  const isAuthFlowPath = AUTH_FLOW_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && !isPublicPath && !isAuthFlowPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublicPath) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
