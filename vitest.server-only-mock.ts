// Vitest doesn't understand Next.js's "react-server" export condition, so
// importing "server-only" directly (as server-side query/data modules do)
// throws outside of the Next.js build. Alias it to this no-op in
// vitest.config.mts instead of avoiding the import in source files.
export {};
