import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client. Uses the SECRET key (equivalent to the old
// "service role" key) - it bypasses Row Level Security entirely, so this
// module must NEVER be imported from a "use client" component. Every caller
// in this app is a Server Component or a Route Handler, which already run
// exclusively on the server (same trust boundary the old fs-based store.ts
// relied on), and role checks (owner/staff) still happen in application code
// via requireSession()/middleware - the DB connection swap does not change
// that RBAC layer, it only changes where the rows come from.
//
// The client is built lazily (on first real use) rather than at module load.
// Next.js's build step ("Collecting page data") imports every route module
// to statically analyze it, without ever calling into it - throwing eagerly
// here at import time killed the production build even though the env vars
// are only actually needed at request time. Lazy init means a missing env
// var only surfaces when a request genuinely tries to touch the database.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    const projectUrl = process.env.SUPABASE_PROJECT_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!projectUrl || !secretKey) {
      throw new Error(
        "Thiếu SUPABASE_PROJECT_URL hoặc SUPABASE_SECRET_KEY trong biến môi trường."
      );
    }
    client = createClient(projectUrl, secretKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getClient();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
