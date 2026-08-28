// Server-side search against The Muse public jobs API (no API key required).
// Always biased to undergrad-friendly levels (Internship + Entry Level).

const MUSE_URL = "https://www.themuse.com/api/public/jobs";

export type SearchType = "RESEARCH" | "INTERNSHIP" | "FULLTIME";

export interface DiscoverResult {
  museId: number;
  title: string;
  company: string;
  location: string;
  level: string;
  url: string;
  description: string;
}

// Undergrad bias: never show senior/mid roles. The toggle refines within this.
function levelsFor(type: SearchType): string[] {
  switch (type) {
    case "INTERNSHIP":
      return ["Internship"];
    case "FULLTIME":
      return ["Entry Level"];
    case "RESEARCH":
    default:
      return ["Internship", "Entry Level"];
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<\s*(br|\/p|\/li|\/div|\/h[1-6])\s*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&rsquo;|&apos;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface MuseJob {
  id: number;
  name: string;
  type: string;
  contents: string;
  company?: { name?: string };
  locations?: { name?: string }[];
  levels?: { name?: string }[];
  categories?: { name?: string }[];
  refs?: { landing_page?: string };
}

async function fetchPage(levels: string[], location: string, page: number): Promise<MuseJob[]> {
  const params = new URLSearchParams();
  levels.forEach((l) => params.append("level", l));
  if (location.trim()) params.set("location", location.trim());
  params.set("page", String(page));
  params.set("descending", "true");

  const res = await fetch(`${MUSE_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`muse ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.results) ? (data.results as MuseJob[]) : [];
}

function tokens(role: string): string[] {
  return role
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((t) => t.length >= 3);
}

export async function searchJobs(opts: {
  role: string;
  location: string;
  type: SearchType;
}): Promise<DiscoverResult[]> {
  const levels = levelsFor(opts.type);
  const roleTokens = tokens(opts.role);
  if (opts.type === "RESEARCH") roleTokens.push("research", "scientist");

  // Pull a few pages so keyword filtering has enough to work with. Tolerate
  // partial failures (rate limits) by keeping whatever pages succeed.
  const pages = await Promise.allSettled([
    fetchPage(levels, opts.location, 1),
    fetchPage(levels, opts.location, 2),
    fetchPage(levels, opts.location, 3),
  ]);

  let jobs: MuseJob[] = [];
  for (const p of pages) if (p.status === "fulfilled") jobs = jobs.concat(p.value);

  // If a location filter wiped everything out, retry once without it.
  if (jobs.length === 0 && opts.location.trim()) {
    try {
      jobs = await fetchPage(levels, "", 1);
    } catch {
      /* ignore */
    }
  }

  const seen = new Set<string>();
  const matched: DiscoverResult[] = [];

  for (const job of jobs) {
    const title = (job.name || "").trim();
    if (!title) continue;
    const url = job.refs?.landing_page || "";
    const key = url || `${title}-${job.id}`;
    if (seen.has(key)) continue;

    // Keyword match against the title (and categories). Empty role = match all.
    const hay = `${title} ${(job.categories || []).map((c) => c.name).join(" ")}`.toLowerCase();
    const matches =
      roleTokens.length === 0 || roleTokens.some((t) => hay.includes(t));
    if (!matches) continue;

    seen.add(key);
    matched.push({
      museId: job.id,
      title,
      company: job.company?.name || "Unknown company",
      location: job.locations?.map((l) => l.name).filter(Boolean).join(" · ") || "—",
      level: job.levels?.map((l) => l.name).filter(Boolean).join(", ") || "",
      url,
      description: stripHtml(job.contents || "").slice(0, 6000),
    });

    if (matched.length >= 30) break;
  }

  return matched;
}
