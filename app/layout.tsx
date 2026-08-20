import "./globals.css";
import type { ReactNode } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function generateMetadata() {
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "site_name")
    .maybeSingle();
  const siteName = data?.value || "ClassHub";
  return {
    title: siteName,
    description: "Class chat, groups, and arcade",
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg0 text-txt0">{children}</body>
    </html>
  );
}
