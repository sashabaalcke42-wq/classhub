import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession, destroySession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope"); // "global" | "group"
  const groupId = searchParams.get("groupId");

  if (scope === "group") {
    if (!groupId) return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    const { data: member } = await supabaseAdmin
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("account_name", session.accountName)
      .maybeSingle();
    if (!member && !session.isAdmin) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }
  }

  let query = supabaseAdmin.from("messages").select("*").order("created_at", { ascending: true }).limit(200);
  if (scope === "global") query = query.eq("scope", "global");
  else if (scope === "group") query = query.eq("scope", "group").eq("group_id", groupId);
  else return NextResponse.json({ error: "Invalid scope" }, { status: 400 });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Guard against a session cookie pointing at an account that no longer
  // exists in the current database (e.g. left over from before a migration).
  const { data: userExists } = await supabaseAdmin
    .from("users")
    .select("account_name")
    .eq("account_name", session.accountName)
    .maybeSingle();
  if (!userExists) {
    await destroySession();
    return NextResponse.json(
      { error: "Your session is out of date — please log in again." },
      { status: 401 }
    );
  }

  const { scope, groupId, body } = await req.json();
  const text = String(body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  if (scope === "group") {
    if (!groupId) return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    const { data: member } = await supabaseAdmin
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("account_name", session.accountName)
      .maybeSingle();
    if (!member && !session.isAdmin) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }
  } else if (scope !== "global") {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const { data: sender } = await supabaseAdmin
    .from("users")
    .select("avatar_path")
    .eq("account_name", session.accountName)
    .maybeSingle();

  // "/poll Question | Option A | Option B | Option C" creates a poll instead
  // of a plain text message.
  let insertRow: Record<string, any> = {
    scope,
    group_id: scope === "group" ? groupId : null,
    from_account: session.accountName,
    display_name: session.displayName,
    is_admin: session.isAdmin,
    avatar_path: sender?.avatar_path ?? null,
    body: text,
  };

  if (text.startsWith("/poll ")) {
    if (scope === "global" && !session.isAdmin) {
      return NextResponse.json({ error: "Only admins can create polls in Global chat" }, { status: 403 });
    }
    const parts = text.slice(6).split("|").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const [question, ...options] = parts;
      insertRow = {
        ...insertRow,
        message_type: "poll",
        poll_question: question,
        poll_options: options.slice(0, 6),
        body: question,
      };
    } else {
      return NextResponse.json(
        { error: "Poll format: /poll Question | Option A | Option B (at least 2 options)" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin.from("messages").insert(insertRow).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep global chat trimmed to the most recent 200 messages so it never
  // overflows — runs after every global send, deleting only what's over cap.
  if (scope === "global") {
    const { count } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("scope", "global");
    if (count && count > 200) {
      const { data: oldest } = await supabaseAdmin
        .from("messages")
        .select("id")
        .eq("scope", "global")
        .order("created_at", { ascending: true })
        .limit(count - 200);
      if (oldest && oldest.length) {
        await supabaseAdmin.from("messages").delete().in("id", oldest.map((m) => m.id));
      }
    }
  }

  return NextResponse.json(data);
}
