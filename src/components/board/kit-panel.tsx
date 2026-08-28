"use client";

import { useState } from "react";
import type { Kit } from "@prisma/client";
import { Check, Copy, Download, RefreshCw, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { KIT_FIELDS, type KitField } from "@/lib/types";

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kit";
}

export function KitPanel({
  kit,
  jobLabel,
  generating,
  onRegenerate,
}: {
  kit: Kit;
  jobLabel: string;
  generating: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState<KitField | null>(null);

  async function copy(field: KitField) {
    await navigator.clipboard.writeText(kit[field]);
    setCopied(field);
    setTimeout(() => setCopied((c) => (c === field ? null : c)), 1500);
  }

  return (
    <Tabs defaultValue={KIT_FIELDS[0].key} className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          {KIT_FIELDS.map((f) => (
            <TabsTrigger key={f.key} value={f.key}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button variant="secondary" size="sm" onClick={onRegenerate} disabled={generating}>
          {generating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Regenerate
        </Button>
      </div>

      {KIT_FIELDS.map((f) => (
        <TabsContent key={f.key} value={f.key} className="mt-3">
          <div className="rounded-lg border border-hairline bg-canvas">
            <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
              <span className="text-xs text-ink-subtle">{f.label}</span>
              <div className="flex gap-1">
                <Button variant="tertiary" size="sm" onClick={() => copy(f.key)}>
                  {copied === f.key ? (
                    <Check size={14} className="text-success" />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copied === f.key ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() =>
                    download(`${slug(jobLabel)}-${slug(f.label)}.md`, kit[f.key])
                  }
                >
                  <Download size={14} />
                  Download
                </Button>
              </div>
            </div>
            <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap px-5 py-4 font-sans text-sm leading-7 text-ink">
              {kit[f.key]}
            </pre>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
