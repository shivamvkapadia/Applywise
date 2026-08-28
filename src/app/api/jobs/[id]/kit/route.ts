import { NextResponse } from "next/server";
import { prisma, getProfile, getSettings } from "@/lib/db";
import { chat, OpenRouterError } from "@/lib/openrouter";
import { KIT_PROMPTS, type KitContext } from "@/lib/prompts";
import { cleanText } from "@/lib/clean-text";

export const runtime = "nodejs";
export const maxDuration = 120;

// POST /api/jobs/[id]/kit — generate (or regenerate) the four artifacts.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [job, profile, settings] = await Promise.all([
    prisma.job.findUnique({ where: { id } }),
    getProfile(),
    getSettings(),
  ]);

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  if (!settings.openRouterApiKey) {
    return NextResponse.json(
      { error: "Add your OpenRouter API key in Settings first." },
      { status: 400 }
    );
  }
  if (!job.descriptionText.trim()) {
    return NextResponse.json(
      { error: "This job has no description yet. Add one, then generate." },
      { status: 400 }
    );
  }

  const ctx: KitContext = {
    jobTitle: job.title,
    company: job.company,
    jobDescription: job.descriptionText,
    resumeText: profile.resumeText,
    candidateName: profile.fullName,
  };

  // Strip any stray markdown so the saved text is always clean plain text.
  const run = async (messages: ReturnType<(typeof KIT_PROMPTS)["coverLetter"]>) =>
    cleanText(
      await chat({ apiKey: settings.openRouterApiKey, model: settings.model, messages })
    );

  try {
    const [coverLetter, resumeBullets, interviewQuestions, companyBrief] =
      await Promise.all([
        run(KIT_PROMPTS.coverLetter(ctx)),
        run(KIT_PROMPTS.resumeBullets(ctx)),
        run(KIT_PROMPTS.interviewQuestions(ctx)),
        run(KIT_PROMPTS.companyBrief(ctx)),
      ]);

    const kit = await prisma.kit.upsert({
      where: { jobId: id },
      create: {
        jobId: id,
        coverLetter,
        resumeBullets,
        interviewQuestions,
        companyBrief,
        modelUsed: settings.model,
      },
      update: {
        coverLetter,
        resumeBullets,
        interviewQuestions,
        companyBrief,
        modelUsed: settings.model,
      },
    });

    return NextResponse.json(kit);
  } catch (err) {
    const status = err instanceof OpenRouterError && err.status === 401 ? 401 : 502;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
