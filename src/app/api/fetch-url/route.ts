import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export const runtime = "nodejs";

// Block-level tags that should produce a line break in the plain-text output.
const BLOCK_TAGS = new Set([
  "P", "DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "UL", "OL",
  "H1", "H2", "H3", "H4", "H5", "H6", "TABLE", "TR", "BLOCKQUOTE",
]);

// Convert Readability's cleaned article HTML into readable plain text:
// paragraphs separated by blank lines, list items as "• " bullets, and
// whitespace within a line collapsed. Much tidier than raw textContent.
function htmlToText(html: string, doc: Document): string {
  const root = doc.createElement("div");
  root.innerHTML = html;
  let out = "";

  const walk = (node: Node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3 /* text */) {
        out += (child.textContent ?? "").replace(/\s+/g, " ");
      } else if (child.nodeType === 1 /* element */) {
        const tag = (child as Element).tagName;
        if (tag === "BR") {
          out += "\n";
          return;
        }
        if (tag === "LI") out += "\n• ";
        walk(child);
        if (tag === "LI") out += "\n";
        else if (BLOCK_TAGS.has(tag)) out += "\n\n";
      }
    });
  };

  walk(root);

  return out
    .replace(/[ \t]+/g, " ") // collapse runs of spaces
    .replace(/ *\n/g, "\n") // drop trailing spaces before newlines
    .replace(/\n[ \t]+/g, "\n") // drop leading spaces after newlines
    .replace(/\n{3,}/g, "\n\n") // cap consecutive blank lines
    .replace(/(\n• [^\n]*)\n\n(?=• )/g, "$1\n") // keep bullets tight together
    .trim();
}

// POST /api/fetch-url — best-effort extraction of a job posting's text.
// Many job boards block scraping; the client always allows manual editing.
export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({}));

  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Enter a valid http(s) URL." }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        // Pose as a normal browser to reduce trivial blocks.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return NextResponse.json(
        {
          error: `The site returned ${res.status}. Paste the job description manually instead.`,
          partial: true,
        },
        { status: 200 }
      );
    }
    html = await res.text();
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not fetch that page (it may block automated access). Paste the job description manually instead.",
        partial: true,
      },
      { status: 200 }
    );
  }

  try {
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;
    const pageTitle = doc.title || "";
    const article = new Readability(doc).parse();

    // Prefer the structured HTML (preserves paragraphs/bullets); fall back to
    // raw text if Readability only returned plain text.
    const descriptionText = (
      article?.content
        ? htmlToText(article.content, doc)
        : (article?.textContent || "").replace(/\n{3,}/g, "\n\n").trim()
    ).slice(0, 20000);

    const host = new URL(url).hostname.replace(/^www\./, "");
    const company = article?.siteName || host.split(".")[0] || "";
    // Title heuristic: readability title, else <title>, trimmed of site suffix.
    const rawTitle = article?.title || pageTitle;
    const title = rawTitle.split(/[|–—\-]/)[0].trim().slice(0, 200);

    return NextResponse.json({
      title,
      company: company.charAt(0).toUpperCase() + company.slice(1),
      descriptionText,
      sourceUrl: url,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Fetched the page but couldn't read it. Paste the description manually.",
        partial: true,
        sourceUrl: url,
      },
      { status: 200 }
    );
  }
}
