import type { ChatMessage } from "./openrouter";

export interface KitContext {
  jobTitle: string;
  company: string;
  jobDescription: string;
  resumeText: string;
  candidateName?: string | null;
}

const SYSTEM = `You are a careful, concrete career assistant helping a job seeker apply.
Rules you must follow:
- Ground everything strictly in the candidate's resume and the job description provided.
- Never invent employers, titles, dates, degrees, or metrics the resume does not support.
- Write in clear, natural, professional English. No fluff, no clichés, no emojis.
- Output CLEAN PLAIN TEXT only. Do NOT use any markdown: no #, ##, ###, no ** or * for bold/italic,
  no backticks, no markdown links or tables. Where a list helps, start each line with a simple
  "- " dash. Plain numbers like "1." are fine for ordered lists.
- No preamble ("Sure, here is...") and no closing meta commentary about yourself or the output.`;

function context(ctx: KitContext): string {
  return `JOB TITLE: ${ctx.jobTitle || "(unknown)"}
COMPANY: ${ctx.company || "(unknown)"}
${ctx.candidateName ? `CANDIDATE NAME: ${ctx.candidateName}\n` : ""}
--- JOB DESCRIPTION ---
${ctx.jobDescription || "(none provided)"}

--- CANDIDATE RESUME ---
${ctx.resumeText || "(no resume on file — say so where relevant and keep claims generic)"}`;
}

function msg(instruction: string, ctx: KitContext): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: `${instruction}\n\n${context(ctx)}` },
  ];
}

export const KIT_PROMPTS = {
  coverLetter: (ctx: KitContext) =>
    msg(
      `Write a tailored cover letter (250-350 words) for this role. Open with a specific hook tied to the company/role, map 2-3 of the candidate's most relevant experiences to the job's needs, and close with a confident call to action. Use the candidate's name in the sign-off if provided. Do not fabricate experience.`,
      ctx
    ),

  resumeBullets: (ctx: KitContext) =>
    msg(
      `Rewrite the candidate's most relevant resume bullets to target this specific job. Produce 6-8 punchy, results-oriented bullets that start with strong verbs and reflect the keywords and priorities in the job description — but only using accomplishments supported by the resume. Write each bullet on its own line starting with "- ". Plain text only — no bold, no headings, no asterisks.`,
      ctx
    ),

  interviewQuestions: (ctx: KitContext) =>
    msg(
      `List the 5 most likely interview questions for this specific role and candidate. Number each question 1 to 5. On the line right below each question, write a short tip (starting with "Tip: ") on what the interviewer is really probing for. Leave a blank line between questions. Plain text only — no bold, no headings, no asterisks.`,
      ctx
    ),

  companyBrief: (ctx: KitContext) =>
    msg(
      `Write a concise one-page company brief to help the candidate prepare. Cover, in this order: what the company does, its likely products/market, why this role matters to them, and 3 smart questions the candidate could ask. Use short plain-text section labels followed by a colon (e.g. "What they do:") — never a # symbol. If a fact is uncertain, phrase it naturally (e.g. "likely" or "appears to"). Plain text only — no bold, no headings with #, no asterisks.`,
      ctx
    ),
} as const;
