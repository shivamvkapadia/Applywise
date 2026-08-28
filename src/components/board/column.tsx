"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type { JobWithKit } from "@/lib/types";
import type { Status } from "@/lib/status";
import { SortableJobCard } from "./job-card";

export function Column({
  status,
  label,
  dotVar,
  jobs,
  onOpen,
}: {
  status: Status;
  label: string;
  dotVar: string;
  jobs: JobWithKit[];
  onOpen: (job: JobWithKit) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col sm:w-auto">
      <div className="mb-2.5 flex items-center gap-2 px-1.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: `var(${dotVar})` }}
          aria-hidden
        />
        <span className="text-eyebrow text-ink-subtle">{label}</span>
        <span className="ml-auto min-w-5 rounded-full bg-surface-2 px-1.5 text-center text-[11px] font-medium text-ink-subtle">
          {jobs.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[60vh] flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors",
          isOver
            ? "border-hairline-strong bg-surface-1"
            : "border-hairline bg-white/[0.012]"
        )}
      >
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <SortableJobCard key={job.id} job={job} onOpen={onOpen} />
          ))}
        </SortableContext>

        {jobs.length === 0 && (
          <p className="m-auto select-none text-center text-xs text-ink-tertiary">
            Drop jobs here
          </p>
        )}
      </div>
    </div>
  );
}
