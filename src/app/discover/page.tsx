"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, Plus, Check, ExternalLink, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchType = "RESEARCH" | "INTERNSHIP" | "FULLTIME";

interface Result {
  museId: number;
  title: string;
  company: string;
  location: string;
  level: string;
  url: string;
  description: string;
}

const TYPE_OPTIONS: { value: SearchType; label: string }[] = [
  { value: "RESEARCH", label: "Research" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "FULLTIME", label: "Full-time" },
];

const STORAGE_KEY = "applywise.discover";

export default function DiscoverPage() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<SearchType>("INTERNSHIP");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<number, "adding" | "done">>({});

  // Remember the last search.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved.role) setRole(saved.role);
      if (saved.location) setLocation(saved.location);
      if (saved.type) setType(saved.type);
    } catch {
      /* ignore */
    }
  }, []);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, location, type }));
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, type }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults(data.results ?? []);
      }
    } catch {
      setError("Something went wrong searching. Try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function addToWishlist(r: Result) {
    setAdded((a) => ({ ...a, [r.museId]: "adding" }));
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: r.title,
          company: r.company,
          location: r.location,
          sourceUrl: r.url || null,
          descriptionText: r.description,
        }),
      });
      if (!res.ok) throw new Error();
      setAdded((a) => ({ ...a, [r.museId]: "done" }));
    } catch {
      setAdded((a) => {
        const next = { ...a };
        delete next[r.museId];
        return next;
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <h1 className="text-display-md text-ink">Find jobs</h1>
      <p className="mt-1 text-sm text-ink-subtle">
        Search openings and send the good ones straight to your Wishlist.
      </p>

      {/* undergrad note */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-hairline bg-surface-1 px-3 py-1.5 text-xs text-ink-muted">
        <GraduationCap size={14} className="text-primary" />
        Showing undergrad-friendly roles — internships & entry-level only.
      </div>

      {/* search form */}
      <Card className="mt-5 p-5">
        <form onSubmit={search} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="role">Role / keywords</Label>
              <Input
                id="role"
                placeholder="software engineer, data, research…"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="loc">Preferred location</Label>
              <Input
                id="loc"
                placeholder="New York, Remote, Bengaluru…"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Type</Label>
            <div className="inline-flex rounded-full bg-canvas p-1">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-ring",
                    type === opt.value
                      ? "bg-surface-2 text-ink"
                      : "text-ink-subtle hover:text-ink-muted"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search jobs
          </Button>
        </form>
      </Card>

      {/* results */}
      <div className="mt-6">
        {loading && (
          <p className="py-10 text-center text-sm text-ink-subtle">Searching openings…</p>
        )}

        {!loading && error && (
          <p className="py-10 text-center text-sm text-ink-muted">{error}</p>
        )}

        {!loading && !error && searched && results.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-subtle">
            No matches. Try a broader role or a different location.
          </p>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="mb-3 text-xs text-ink-subtle">{results.length} matches</p>
            <div className="space-y-2.5">
              {results.map((r) => (
                <Card key={r.museId} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink">{r.title}</h3>
                      <p className="mt-0.5 text-xs text-ink-subtle">
                        {r.company} · {r.location}
                        {r.level ? ` · ${r.level}` : ""}
                      </p>
                      {r.description && (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-tertiary">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Button
                        size="sm"
                        variant={added[r.museId] === "done" ? "secondary" : "primary"}
                        disabled={Boolean(added[r.museId])}
                        onClick={() => addToWishlist(r)}
                      >
                        {added[r.museId] === "adding" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : added[r.museId] === "done" ? (
                          <Check size={14} className="text-success" />
                        ) : (
                          <Plus size={14} />
                        )}
                        {added[r.museId] === "done" ? "Added" : "Wishlist"}
                      </Button>
                      {r.url && (
                        <Link
                          href={r.url}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-ink-subtle hover:text-ink"
                        >
                          View <ExternalLink size={11} />
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
