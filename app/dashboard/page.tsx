import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import ChatRoom from "@/components/ChatRoom";

export default async function GlobalChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <ChatRoom title="Global chat" scope="global" me={session} />;
}
