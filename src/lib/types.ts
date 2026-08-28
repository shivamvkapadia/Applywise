import type { Job, Kit } from "@prisma/client";

export type JobWithKit = Job & { kit: Kit | null };

export const KIT_FIELDS = [
  { key: "coverLetter", label: "Cover Letter" },
  { key: "resumeBullets", label: "Resume Bullets" },
  { key: "interviewQuestions", label: "Interview Questions" },
  { key: "companyBrief", label: "Company Brief" },
] as const;

export type KitField = (typeof KIT_FIELDS)[number]["key"];
