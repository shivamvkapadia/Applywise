"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, Check, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";

interface ProfileData {
  resumeText: string;
  resumeFileName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  links: string | null;
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Could not load your profile."));
  }, []);

  function set<K extends keyof ProfileData>(key: K, value: string) {
    setData((d) => (d ? { ...d, [key]: value } : d));
    setSaved(false);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/profile/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        return;
      }
      setData(json);
    } catch {
      setError("Network error during upload.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save.");
        return;
      }
      setData(json);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-display-md text-ink">My profile</h1>
      <p className="mt-1 text-sm text-ink-subtle">
        Your resume powers every tailored cover letter and resume rewrite.
      </p>

      <Card className="mt-6 p-6 space-y-5">
        <div>
          <Label>Resume</Label>
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            <Button
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Upload PDF or DOCX
            </Button>
            {data?.resumeFileName && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-subtle">
                <FileText size={14} />
                {data.resumeFileName}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-tertiary">
            We extract the text so you can review and tidy it below.
          </p>
        </div>

        <div>
          <Label htmlFor="resume-text">Resume text</Label>
          <Textarea
            id="resume-text"
            className="min-h-64 font-mono text-xs"
            placeholder="Upload a file above, or paste your resume here…"
            value={data?.resumeText ?? ""}
            onChange={(e) => set("resumeText", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="p-name">Full name</Label>
            <Input
              id="p-name"
              value={data?.fullName ?? ""}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-email">Email</Label>
            <Input
              id="p-email"
              value={data?.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-phone">Phone</Label>
            <Input
              id="p-phone"
              value={data?.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-links">Links</Label>
            <Input
              id="p-links"
              placeholder="LinkedIn, portfolio…"
              value={data?.links ?? ""}
              onChange={(e) => set("links", e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-ink-muted">{error}</p>}

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || !data}>
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saved ? (
              <Check size={16} className="text-success" />
            ) : null}
            {saved ? "Saved" : "Save profile"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
