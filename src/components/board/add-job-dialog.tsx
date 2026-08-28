"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import type { JobWithKit } from "@/lib/types";

const empty = { url: "", title: "", company: "", location: "", description: "" };

export function AddJobDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (job: JobWithKit) => void;
}) {
  const [form, setForm] = useState(empty);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm(empty);
    setNote(null);
    setError(null);
  }

  async function handleFetch() {
    if (!form.url.trim()) return;
    setFetching(true);
    setNote(null);
    setError(null);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not fetch that page.");
        return;
      }
      if (data.partial || data.error) {
        setNote(data.error ?? "Couldn't read the page — fill the fields manually.");
      } else {
        setNote("Pulled the posting in — review and edit before saving.");
      }
      setForm((f) => ({
        ...f,
        title: data.title || f.title,
        company: data.company || f.company,
        description: data.descriptionText || f.description,
      }));
    } catch {
      setError("Network error while fetching the page.");
    } finally {
      setFetching(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          company: form.company,
          location: form.location,
          descriptionText: form.description,
          sourceUrl: form.url.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save the job.");
        return;
      }
      onCreated(data as JobWithKit);
      reset();
      onOpenChange(false);
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a job</DialogTitle>
          <DialogDescription>
            Paste a job link to auto-fill, or type the details yourself.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="job-url">Job link (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="job-url"
                placeholder="https://company.com/careers/role"
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={handleFetch}
                disabled={fetching || !form.url.trim()}
              >
                {fetching ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Fetch
              </Button>
            </div>
            {note && <p className="mt-1.5 text-xs text-ink-subtle">{note}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="job-title">Role title</Label>
              <Input
                id="job-title"
                placeholder="Product Designer"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="job-company">Company</Label>
              <Input
                id="job-company"
                placeholder="Acme Inc."
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="job-location">Location (optional)</Label>
            <Input
              id="job-location"
              placeholder="Remote · Bengaluru"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="job-desc">Job description</Label>
            <Textarea
              id="job-desc"
              className="min-h-40"
              placeholder="Paste the full job description here…"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-ink-muted">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="tertiary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              Add to Wishlist
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
