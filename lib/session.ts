import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabaseAdmin";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
const COOKIE_NAME = "classhub_session";

export type SessionPayload = {
  accountName: string;
  displayName: string;
  isAdmin: boolean;
};

type TokenPayload = SessionPayload & { sessionVersion: number };

export async function createSession(payload: SessionPayload) {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("session_version")
    .eq("account_name", payload.accountName)
    .maybeSingle();

  const token = await new SignJWT({ ...payload, sessionVersion: user?.session_version ?? 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const claims = payload as unknown as TokenPayload;

    // Check ban status and force-logout (session_version bump) on every
    // request. A stale/banned session is treated as logged out, though the
    // cookie itself isn't cleared here — Next.js doesn't allow mutating
    // cookies from a Server Component render, only from Route Handlers.
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("session_version, banned_until, is_admin")
      .eq("account_name", claims.accountName)
      .maybeSingle();

    if (!user) return null;
    if (user.session_version !== claims.sessionVersion) return null;
    if (user.banned_until && new Date(user.banned_until) > new Date()) return null;

    // isAdmin is read from the database here, not the token — otherwise
    // promoting/demoting someone wouldn't take effect until they logged out
    // and back in, since the JWT's isAdmin claim is fixed at login time.
    return { accountName: claims.accountName, displayName: claims.displayName, isAdmin: user.is_admin };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
