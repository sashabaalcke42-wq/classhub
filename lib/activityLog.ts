import { supabaseAdmin } from "./supabaseAdmin";

export async function logActivity(
  actor: string,
  action: string,
  target: string | null,
  detail: string | null
) {
  await supabaseAdmin.from("activity_log").insert({ actor, action, target, detail });
}
