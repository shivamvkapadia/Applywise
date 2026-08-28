import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/jobs/[id] — edit editable fields.
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  for (const field of ["title", "company", "location", "descriptionText", "notes"]) {
    if (typeof body[field] === "string") data[field] = body[field].slice(0, 20000);
  }
  if (typeof body.sourceUrl === "string" || body.sourceUrl === null) {
    data.sourceUrl = body.sourceUrl ? String(body.sourceUrl).slice(0, 2000) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const job = await prisma.job.update({
      where: { id },
      data,
      include: { kit: true },
    });
    return NextResponse.json(job);
  } catch {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
}

// DELETE /api/jobs/[id] — remove a card (cascades to its kit).
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
}
