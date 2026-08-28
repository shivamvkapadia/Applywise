// The five fixed pipeline columns. SQLite has no native enums, so this is the
// single source of truth for allowed `Job.status` values + their presentation.

export const STATUSES = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
] as const;

export type Status = (typeof STATUSES)[number];

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export const COLUMNS: {
  status: Status;
  label: string;
  /** CSS var name for the 8px header dot (defined in globals.css). */
  dotVar: string;
}[] = [
  { status: "WISHLIST", label: "Wishlist", dotVar: "--dot-wishlist" },
  { status: "APPLIED", label: "Applied", dotVar: "--dot-applied" },
  { status: "INTERVIEWING", label: "Interviewing", dotVar: "--dot-interviewing" },
  { status: "OFFER", label: "Offer", dotVar: "--dot-offer" },
  { status: "REJECTED", label: "Rejected", dotVar: "--dot-rejected" },
];
