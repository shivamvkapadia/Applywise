import { NextResponse } from "next/server";
import { searchJobs, type SearchType } from "@/lib/the-muse";

export const runtime = "nodejs";

const TYPES: SearchType[] = ["RESEARCH", "INTERNSHIP", "FULLTIME"];

// POST /api/discover — search undergrad-friendly jobs via The Muse.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const role = typeof body.role === "string" ? body.role : "";
  const location = typeof body.location === "string" ? body.location : "";
  const type: SearchType = TYPES.includes(body.type) ? body.type : "INTERNSHIP";

  try {
    const results = await searchJobs({ role, location, type });
    return NextResponse.json({ results });
  } catch (err) {
    const msg = (err as Error).message || "";
    const rateLimited = msg.includes("429");
    return NextResponse.json(
      {
        error: rateLimited
          ? "The job service is busy right now — wait a moment and search again."
          : "Couldn't reach the job service. Try again in a bit.",
      },
      { status: 200 } // soft error so the UI can show a friendly message
    );
  }
}
