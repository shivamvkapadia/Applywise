import { NextResponse } from "next/server";
import { prisma, getProfile, SINGLETON_ID } from "@/lib/db";

// GET /api/profile
export async function GET() {
  const p = await getProfile();
  return NextResponse.json(p);
}

// PUT /api/profile — update resume text + optional contact fields.
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const data: Record<string, string | null> = {};

  if (typeof body.resumeText === "string") data.resumeText = body.resumeText.slice(0, 50000);
  for (const field of ["fullName", "email", "phone", "links"]) {
    if (typeof body[field] === "string") data[field] = body[field].slice(0, 500) || null;
  }

  const saved = await prisma.profile.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...data },
    update: data,
  });
  return NextResponse.json(saved);
}
