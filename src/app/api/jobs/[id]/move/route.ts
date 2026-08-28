import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isStatus } from "@/lib/status";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/jobs/[id]/move — drag result.
// Body: { status, orderedIds } where orderedIds is the full id order of the
// destination column. We rewrite order = index for those ids in one transaction.
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, orderedIds } = body ?? {};

  if (!isStatus(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (!Array.isArray(orderedIds) || !orderedIds.includes(id)) {
    return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.job.update({ where: { id }, data: { status } }),
    ...orderedIds.map((jobId: string, index: number) =>
      prisma.job.update({ where: { id: jobId }, data: { order: index } })
    ),
  ]);

  return NextResponse.json({ ok: true });
}
