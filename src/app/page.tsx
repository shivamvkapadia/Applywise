import { prisma } from "@/lib/db";
import { Board } from "@/components/board/board";
import type { JobWithKit } from "@/lib/types";

// Always read fresh from the local DB.
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const jobs = (await prisma.job.findMany({
    include: { kit: true },
    orderBy: [{ order: "asc" }],
  })) as JobWithKit[];

  return <Board initialJobs={jobs} />;
}
