import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Rail from "@/components/Rail";
import AnnouncementBanner from "@/components/AnnouncementBanner";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!session.isAdmin) {
    const { data: setting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();
    if (setting?.value === "true") redirect("/maintenance");
  }

  return (
    <div className="h-screen flex flex-col">
      <AnnouncementBanner />
      <div className="flex-1 flex min-h-0">
        <Rail accountName={session.accountName} displayName={session.displayName} isAdmin={session.isAdmin} />
        <div className="flex-1 flex min-w-0 min-h-0">{children}</div>
      </div>
    </div>
  );
}
