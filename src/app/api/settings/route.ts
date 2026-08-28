import { NextResponse } from "next/server";
import { prisma, getSettings, SINGLETON_ID } from "@/lib/db";
import { chat } from "@/lib/openrouter";

// Never send the raw key to the browser — only whether one is set.
function publicSettings(s: { openRouterApiKey: string; model: string }) {
  return { hasApiKey: Boolean(s.openRouterApiKey), model: s.model };
}

// GET /api/settings
export async function GET() {
  const s = await getSettings();
  return NextResponse.json(publicSettings(s));
}

// PUT /api/settings — update key/model, or test the connection.
// Body: { apiKey?, model?, test? }
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const current = await getSettings();

  // Use the incoming key if provided, otherwise the stored one (for "Test").
  const apiKey =
    typeof body.apiKey === "string" && body.apiKey.length > 0
      ? body.apiKey.trim()
      : current.openRouterApiKey;
  const model =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim()
      : current.model;

  if (body.test) {
    try {
      await chat({
        apiKey,
        model,
        messages: [{ role: "user", content: "Reply with the single word: ok" }],
        maxTokens: 5,
      });
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: (err as Error).message },
        { status: 200 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  const data: Record<string, string> = { model };
  if (typeof body.apiKey === "string") data.openRouterApiKey = body.apiKey.trim();

  const saved = await prisma.settings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...data },
    update: data,
  });
  return NextResponse.json(publicSettings(saved));
}
