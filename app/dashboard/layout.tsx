import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Rail from "@/components/Rail";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="h-screen flex">
      <Rail accountName={session.accountName} displayName={session.displayName} isAdmin={session.isAdmin} />
      <div className="flex-1 flex min-w-0">{children}</div>
    </div>
  );
}
