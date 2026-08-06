import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DMRoom from "@/components/DMRoom";

export default async function DMPage({ params }: { params: Promise<{ account: string }> }) {
  const { account } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const { data: other } = await supabaseAdmin
    .from("users")
    .select("display_name")
    .eq("account_name", account)
    .maybeSingle();

  return (
    <DMRoom
      otherAccount={account}
      otherDisplay={other?.display_name ?? account}
      me={session}
    />
  );
}
