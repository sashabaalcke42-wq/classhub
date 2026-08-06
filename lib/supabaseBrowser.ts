import { createClient } from "@supabase/supabase-js";

// Safe to use in the browser -- the anon key can only SELECT global/group
// messages (see supabase/schema.sql). It can never read DMs or write anything.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
