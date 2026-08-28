"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { COLUMNS, STATUSES, type Status } from "@/lib/status";
import type { JobWithKit } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Column } from "./column";
import { JobCardView } from "./job-card";
import { AddJobDialog } from "./add-job-dialog";
import { JobDetailDialog } from "./job-detail-dialog";

type Grouped = Record<Status, JobWithKit[]>;

function group(jobs: JobWithKit[]): Grouped {
  const out = Object.fromEntries(STATUSES.map((s) => [s, []])) as unknown as Grouped;
  for (const job of jobs) {
    const status = (STATUSES as readonly string[]).includes(job.status)
      ? (job.status as Status)
      : "WISHLIST";
    out[status].push(job);
  }
  for (const s of STATUSES) out[s].sort((a, b) => a.order - b.order);
  return out;
}

export function Board({ initialJobs }: { initialJobs: JobWithKit[] }) {
  const [columns, setColumns] = useState<Grouped>(() => group(initialJobs));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<JobWithKit | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const totalJobs = STATUSES.reduce((n, s) => n + columns[s].length, 0);

  const activeJob = useMemo(() => {
    if (!activeId) return null;
    for (const s of STATUSES) {
      const found = columns[s].find((j) => j.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  const findContainer = (id: string): Status | undefined => {
    if ((STATUSES as readonly string[]).includes(id)) return id as Status;
    return STATUSES.find((s) => columns[s].some((j) => j.id === id));
  };

  async function persist(jobId: string, status: Status, orderedIds: string[]) {
    try {
      await fetch(`/api/jobs/${jobId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, orderedIds }),
      });
    } catch {
      /* optimistic UI; a failed reorder self-heals on next reload */
    }
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  // Move the dragged card between columns live as it hovers.
  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeC = findContainer(String(active.id));
    const overC = findContainer(String(over.id));
    if (!activeC || !overC || activeC === overC) return;

    setColumns((prev) => {
      const activeItems = prev[activeC];
      const overItems = prev[overC];
      const moved = activeItems.find((j) => j.id === active.id);
      if (!moved) return prev;

      const overIsContainer = (STATUSES as readonly string[]).includes(String(over.id));
      const overIndex = overIsContainer
        ? overItems.length
        : Math.max(0, overItems.findIndex((j) => j.id === over.id));

      return {
        ...prev,
        [activeC]: activeItems.filter((j) => j.id !== active.id),
        [overC]: [
          ...overItems.slice(0, overIndex),
          { ...moved, status: overC },
          ...overItems.slice(overIndex),
        ],
      };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    const id = String(active.id);
    const activeC = findContainer(id);
    setActiveId(null);
    if (!activeC) return;

    const overC = over ? findContainer(String(over.id)) ?? activeC : activeC;

    setColumns((prev) => {
      const items = prev[overC];
      const oldIndex = items.findIndex((j) => j.id === id);
      let newIndex = items.length - 1;
      if (over && !(STATUSES as readonly string[]).includes(String(over.id))) {
        const idx = items.findIndex((j) => j.id === over.id);
        if (idx >= 0) newIndex = idx;
      }
      if (oldIndex < 0) return prev;

      const reordered = arrayMove(items, oldIndex, Math.max(0, newIndex));
      void persist(id, overC, reordered.map((j) => j.id));
      return { ...prev, [overC]: reordered };
    });
  }

  // ---- state sync helpers for dialogs ----
  function upsertJob(job: JobWithKit) {
    setColumns((prev) => {
      const next = { ...prev };
      for (const s of STATUSES) next[s] = next[s].filter((j) => j.id !== job.id);
      const status = (STATUSES as readonly string[]).includes(job.status)
        ? (job.status as Status)
        : "WISHLIST";
      next[status] = [...next[status], job].sort((a, b) => a.order - b.order);
      return next;
    });
  }

  function addJob(job: JobWithKit) {
    setColumns((prev) => ({
      ...prev,
      WISHLIST: [job, ...prev.WISHLIST],
    }));
  }

  function removeJob(id: string) {
    setColumns((prev) => {
      const next = { ...prev };
      for (const s of STATUSES) next[s] = next[s].filter((j) => j.id !== id);
      return next;
    });
    setSelected(null);
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-display-md text-ink">Your pipeline</h1>
          <p className="mt-1 text-sm text-ink-subtle">
            {totalJobs === 0
              ? "Add your first job to get started."
              : `${totalJobs} job${totalJobs === 1 ? "" : "s"} in flight.`}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Add job
        </Button>
      </div>

      <DndContext
        id="applywise-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-flow-col auto-cols-[18rem] gap-3 overflow-x-auto pb-4 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 lg:grid-cols-5 sm:overflow-visible">
          {COLUMNS.map((col) => (
            <Column
              key={col.status}
              status={col.status}
              label={col.label}
              dotVar={col.dotVar}
              jobs={columns[col.status]}
              onOpen={setSelected}
            />
          ))}
        </div>

        <DragOverlay>
          {activeJob ? <JobCardView job={activeJob} dragging /> : null}
        </DragOverlay>
      </DndContext>

      <AddJobDialog open={addOpen} onOpenChange={setAddOpen} onCreated={addJob} />
      <JobDetailDialog
        job={selected}
        onClose={() => setSelected(null)}
        onUpdated={upsertJob}
        onDeleted={removeJob}
      />
    </div>
  );
}
