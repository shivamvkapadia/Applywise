import { NextResponse } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/unlock — verify the password and set the auth cookie.
export async function POST(req: Request) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    // No lock configured — nothing to unlock.
    return NextResponse.json({ ok: true });
  }

  const { password: attempt } = await req.json().catch(() => ({}));
  if (typeof attempt !== "string" || attempt !== password) {
    return NextResponse.json({ ok: false, error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await authToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
