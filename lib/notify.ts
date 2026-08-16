import { supabaseAdmin } from "./supabaseAdmin";

export async function notify(accountName: string, type: string, title: string, body?: string, link?: string) {
  await supabaseAdmin.from("notifications").insert({
    account_name: accountName,
    type,
    title,
    body: body ?? null,
    link: link ?? null,
  });
}

export async function notifyAdmins(type: string, title: string, body?: string, link?: string) {
  const { data: admins } = await supabaseAdmin.from("users").select("account_name").eq("is_admin", true);
  for (const a of admins ?? []) await notify(a.account_name, type, title, body, link);
}

export async function notifyAllUsers(type: string, title: string, body?: string, link?: string, excludeAccount?: string) {
  const { data: users } = await supabaseAdmin.from("users").select("account_name");
  for (const u of users ?? []) {
    if (u.account_name === excludeAccount) continue;
    await notify(u.account_name, type, title, body, link);
  }
}
