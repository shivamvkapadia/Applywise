import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { prisma, SINGLETON_ID } from "@/lib/db";

export const runtime = "nodejs";

// POST /api/profile/upload — multipart file (PDF or DOCX).
// Extracts text, saves it + the filename, returns the updated profile.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const name = file.name || "resume";
  const lower = name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let text = "";
  try {
    if (lower.endsWith(".pdf")) {
      // unpdf is bundled with a pdf.js build that runs in Node/serverless.
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(pdf, { mergePages: true });
      text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
    } else if (lower.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json(
        { error: "Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: `Could not read that file (${(err as Error).message}). You can paste your resume text instead.`,
      },
      { status: 422 }
    );
  }

  text = text.replace(/\n{3,}/g, "\n\n").trim();

  const saved = await prisma.profile.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, resumeText: text, resumeFileName: name },
    update: { resumeText: text, resumeFileName: name },
  });

  return NextResponse.json(saved);
}
