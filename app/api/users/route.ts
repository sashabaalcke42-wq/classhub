import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const sort = searchParams.get("sort") ?? "name"; // name | coins | joined

  let query = supabaseAdmin
    .from("users")
    .select("account_name, display_name, avatar_path, credits, created_at")
    .neq("account_name", session.accountName);

  if (search) {
    query = query.or(`account_name.ilike.%${search}%,display_name.ilike.%${search}%`);
  }
  if (sort === "coins") query = query.order("credits", { ascending: false });
  else if (sort === "joined") query = query.order("created_at", { ascending: false });
  else query = query.order("display_name", { ascending: true });

  const { data, error } = await query.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
