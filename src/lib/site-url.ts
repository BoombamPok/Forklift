/**
 * Base URL for links that must be absolute (e.g. a Supabase invite email's
 * redirect target - it's opened from an email client, not a page on this
 * site, so a relative path won't work). `NEXT_PUBLIC_SITE_URL` is an
 * explicit override for a custom production domain; `VERCEL_URL` is
 * injected automatically by Vercel on every deployment (preview and
 * production) with no configuration needed.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
