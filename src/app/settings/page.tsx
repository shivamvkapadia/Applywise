"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, X, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const MODEL_OPTIONS = [
  "anthropic/claude-sonnet-4.5",
  "anthropic/claude-3.7-sonnet",
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o",
  "google/gemini-2.0-flash-001",
];

type TestState =
  | { kind: "idle" }
  | { kind: "testing" }
  | { kind: "ok" }
  | { kind: "fail"; message: string };

export default function SettingsPage() {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("anthropic/claude-sonnet-4.5");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [test, setTest] = useState<TestState>({ kind: "idle" });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setHasApiKey(s.hasApiKey);
        setModel(s.model);
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Only send the key if the user typed a new one.
        body: JSON.stringify({ model, ...(apiKey ? { apiKey } : {}) }),
      });
      const s = await res.json();
      setHasApiKey(s.hasApiKey);
      setApiKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  async function runTest() {
    setTest({ kind: "testing" });
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true, model, ...(apiKey ? { apiKey } : {}) }),
      });
      const data = await res.json();
      setTest(data.ok ? { kind: "ok" } : { kind: "fail", message: data.error });
    } catch {
      setTest({ kind: "fail", message: "Network error." });
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-display-md text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink-subtle">
        Connect OpenRouter so Applywise can write your application kits.
      </p>

      <Card className="mt-6 p-6 space-y-5">
        <div>
          <Label htmlFor="api-key">OpenRouter API key</Label>
          <div className="relative">
            <KeyRound
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
            />
            <Input
              id="api-key"
              type="password"
              className="pl-9"
              placeholder={hasApiKey ? "•••••••••• (saved — type to replace)" : "sk-or-v1-…"}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTest({ kind: "idle" });
              }}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-tertiary">
            Stored locally on your computer only. Get a key at openrouter.ai/keys.
          </p>
        </div>

        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            list="model-options"
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setTest({ kind: "idle" });
            }}
          />
          <datalist id="model-options">
            {MODEL_OPTIONS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <p className="mt-1.5 text-xs text-ink-tertiary">
            Default is Claude Sonnet. Type any OpenRouter model id to switch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saved ? (
              <Check size={16} className="text-success" />
            ) : null}
            {saved ? "Saved" : "Save"}
          </Button>
          <Button variant="secondary" onClick={runTest} disabled={test.kind === "testing"}>
            {test.kind === "testing" && <Loader2 size={16} className="animate-spin" />}
            Test connection
          </Button>

          {test.kind === "ok" && (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check size={15} /> Connected
            </span>
          )}
          {test.kind === "fail" && (
            <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
              <X size={15} /> {test.message}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
