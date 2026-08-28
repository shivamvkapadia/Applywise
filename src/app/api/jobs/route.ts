import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/jobs — all jobs (with their kit), ordered for board rendering.
export async function GET() {
  const jobs = await prisma.job.findMany({
    include: { kit: true },
    orderBy: [{ status: "asc" }, { order: "asc" }],
  });
  return NextResponse.json(jobs);
}

// POST /api/jobs — create a card in WISHLIST from parsed fields.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    title = "",
    company = "",
    location = "",
    sourceUrl = null,
    descriptionText = "",
  } = body ?? {};

  if (!title && !company && !descriptionText) {
    return NextResponse.json(
      { error: "Add at least a title, company, or job description." },
      { status: 400 }
    );
  }

  // New cards go to the top of the Wishlist column.
  const min = await prisma.job.aggregate({
    where: { status: "WISHLIST" },
    _min: { order: true },
  });
  const order = (min._min.order ?? 0) - 1;

  const job = await prisma.job.create({
    data: {
      title: String(title).slice(0, 300),
      company: String(company).slice(0, 200),
      location: String(location).slice(0, 200),
      sourceUrl: sourceUrl ? String(sourceUrl).slice(0, 2000) : null,
      descriptionText: String(descriptionText).slice(0, 20000),
      status: "WISHLIST",
      order,
    },
    include: { kit: true },
  });

  return NextResponse.json(job, { status: 201 });
}
