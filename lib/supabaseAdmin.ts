import { createClient } from "@supabase/supabase-js";

// This client uses the SERVICE ROLE key and must never run in the browser.
// It bypasses Row Level Security, so every API route that uses it is
// responsible for checking the caller's session/permissions itself.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
