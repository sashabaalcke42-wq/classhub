import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ChatRoom from "@/components/ChatRoom";

export default async function GroupChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const { data: group } = await supabaseAdmin.from("groups").select("*").eq("id", id).single();
  if (!group) redirect("/dashboard");

  return <ChatRoom title={group.name} scope="group" groupId={group.id} me={session} />;
}
