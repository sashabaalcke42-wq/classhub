import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ChatRoom from "@/components/ChatRoom";
import GroupSidebar from "@/components/GroupSidebar";

export default async function GroupChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const { data: group } = await supabaseAdmin.from("groups").select("*").eq("id", id).single();
  if (!group) redirect("/dashboard");

  const { data: membership } = await supabaseAdmin
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("account_name", session.accountName)
    .maybeSingle();
  const canPin = session.isAdmin || membership?.role === "admin";

  return (
    <div className="flex-1 flex min-w-0">
      <ChatRoom title={group.name} scope="group" groupId={group.id} me={session} canPin={canPin} />
      <GroupSidebar groupId={group.id} groupName={group.name} me={session} />
    </div>
  );
}
