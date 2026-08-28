"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  Trash2,
  ExternalLink,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import type { JobWithKit } from "@/lib/types";
import { KitPanel } from "./kit-panel";

export function JobDetailDialog({
  job,
  onClose,
  onUpdated,
  onDeleted,
}: {
  job: JobWithKit | null;
  onClose: () => void;
  onUpdated: (job: JobWithKit) => void;
  onDeleted: (id: string) => void;
}) {
  return (
    <Dialog open={Boolean(job)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        {job && (
          <JobDetail
            key={job.id}
            job={job}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function JobDetail({
  job,
  onUpdated,
  onDeleted,
}: {
  job: JobWithKit;
  onUpdated: (job: JobWithKit) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState({
    title: job.title,
    company: job.company,
    location: job.location,
    descriptionText: job.descriptionText,
    notes: job.notes,
  });
  const [kit, setKit] = useState(job.kit);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      onUpdated({ ...(data as JobWithKit), kit });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      // Persist any edits to the description first so the AI uses them.
      await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const res = await fetch(`/api/jobs/${job.id}/kit`, { method: "POST" });
      // Read defensively: an unexpected non-JSON response (e.g. an HTML error
      // page) should surface a real message, not a generic network error.
      const raw = await res.text();
      let data: { error?: string } & Record<string, unknown> = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        setError(`Unexpected server response (HTTP ${res.status}). Try again.`);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? `Generation failed (HTTP ${res.status}).`);
        return;
      }
      setKit(data as typeof kit);
      onUpdated({ ...job, ...form, kit: data as typeof kit });
    } catch {
      setError("Couldn't reach the server. Is the app still running?");
    } finally {
      setGenerating(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this job and its generated kit?")) return;
    await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    onDeleted(job.id);
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle>{form.title || "Untitled role"}</DialogTitle>
        <p className="text-sm text-ink-subtle">
          {form.company || "Unknown company"}
          {form.location ? ` · ${form.location}` : ""}
          {job.sourceUrl && (
            <>
              {" · "}
              <Link
                href={job.sourceUrl}
                target="_blank"
                className="inline-flex items-center gap-1 text-primary hover:text-primary-hover"
              >
                Source <ExternalLink size={12} />
              </Link>
            </>
          )}
        </p>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="d-title">Role title</Label>
            <Input id="d-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="d-company">Company</Label>
            <Input
              id="d-company"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="d-desc">Job description</Label>
          <Textarea
            id="d-desc"
            className="min-h-32"
            value={form.descriptionText}
            onChange={(e) => set("descriptionText", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="d-notes">Your notes</Label>
          <Textarea
            id="d-notes"
            className="min-h-20"
            placeholder="Recruiter name, referral, follow-up date…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
              <Check size={14} className="text-success" />
            ) : null}
            {saved ? "Saved" : "Save changes"}
          </Button>
          <Button variant="danger" size="sm" onClick={remove}>
            <Trash2 size={14} />
            Delete
          </Button>
        </div>

        {/* ---- AI kit ---- */}
        <div className="rounded-xl border border-hairline bg-surface-1 edge-highlight p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Application kit</h3>
              <p className="text-xs text-ink-subtle">
                Tailored cover letter, resume bullets, interview questions & company brief.
              </p>
            </div>
            {!kit && (
              <Button onClick={generate} disabled={generating}>
                {generating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                Generate kit
              </Button>
            )}
          </div>

          {error && <p className="mb-3 text-sm text-ink-muted">{error}</p>}

          {generating && !kit && (
            <p className="py-6 text-center text-sm text-ink-subtle">
              Writing your kit… this takes 10–30 seconds.
            </p>
          )}

          {kit ? (
            <KitPanel
              kit={kit}
              jobLabel={`${form.company}-${form.title}`}
              generating={generating}
              onRegenerate={generate}
            />
          ) : (
            !generating && (
              <p className="text-sm text-ink-tertiary">
                No kit yet. Make sure your resume is set in Profile and your API key in
                Settings, then generate.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
