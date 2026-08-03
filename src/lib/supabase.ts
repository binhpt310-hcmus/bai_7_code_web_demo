import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client. Uses the SECRET key (equivalent to the old
// "service role" key) - it bypasses Row Level Security entirely, so this
// module must NEVER be imported from a "use client" component. Every caller
// in this app is a Server Component or a Route Handler, which already run
// exclusively on the server (same trust boundary the old fs-based store.ts
// relied on), and role checks (owner/staff) still happen in application code
// via requireSession()/middleware - the DB connection swap does not change
// that RBAC layer, it only changes where the rows come from.
const projectUrl = process.env.SUPABASE_PROJECT_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!projectUrl || !secretKey) {
  throw new Error(
    "Thiếu SUPABASE_PROJECT_URL hoặc SUPABASE_SECRET_KEY trong .env.local"
  );
}

export const supabase = createClient(projectUrl, secretKey, {
  auth: { persistSession: false },
});
