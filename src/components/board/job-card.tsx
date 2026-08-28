"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Sparkles, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobWithKit } from "@/lib/types";

function kitReady(job: JobWithKit) {
  return Boolean(job.kit && job.kit.coverLetter);
}

function monogram(job: JobWithKit) {
  const source = job.company || job.title || "?";
  return source.trim().charAt(0).toUpperCase() || "?";
}

/** Pure visual card — reused inside the drag overlay. */
export function JobCardView({
  job,
  dragging,
}: {
  job: JobWithKit;
  dragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-hairline bg-surface-1 edge-highlight p-3 text-left transition-colors",
        "hover:border-hairline-strong hover:bg-surface-2",
        dragging && "bg-surface-2 border-hairline-strong shadow-lg shadow-black/40"
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-3 text-xs font-semibold text-ink-muted"
          aria-hidden
        >
          {monogram(job)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-ink line-clamp-2">
            {job.title || "Untitled role"}
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-subtle">
            {job.company || "Unknown company"}
            {job.location ? ` · ${job.location}` : ""}
          </p>
        </div>
      </div>

      {(kitReady(job) || job.sourceUrl) && (
        <div className="mt-2.5 flex items-center gap-2">
          {kitReady(job) && (
            <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-muted">
              <Sparkles size={11} className="text-primary" />
              Kit ready
            </span>
          )}
          {job.sourceUrl && (
            <span className="inline-flex items-center text-ink-tertiary" title="Has a source link">
              <Link2 size={12} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** Sortable + clickable card on the board. */
export function SortableJobCard({
  job,
  onOpen,
}: {
  job: JobWithKit;
  onOpen: (job: JobWithKit) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "block w-full cursor-grab rounded-lg focus-ring active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      onClick={() => onOpen(job)}
      {...attributes}
      {...listeners}
    >
      <JobCardView job={job} />
    </button>
  );
}
