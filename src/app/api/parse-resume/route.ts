import { NextRequest, NextResponse } from "next/server";
import { uploadResumeBuffer } from "@/lib/resume-storage";
import { extractTextFromPdfBuffer, parseResumeWithAi } from "@/lib/resume-parser";

export const dynamic = "force-dynamic";

// In-memory sliding rate limiter para contenção de custos e abuso de OpenAI/Storage
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5; // máx 5 uploads por minuto por IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const now = Date.now();
    const clientRecord = ipRequestMap.get(ip);

    if (clientRecord && now < clientRecord.resetAt) {
      if (clientRecord.count >= RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: "Limite de uploads excedido. Por favor, aguarde 1 minuto antes de enviar outro currículo." },
          { status: 429 }
        );
      }
      clientRecord.count++;
    } else {
      ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }

    const form = await req.formData();
    const file = form.get("resume") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo de currículo (PDF) foi fornecido." },
        { status: 400 }
      );
    }

    // Limite de 15 MB para currículos
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "O arquivo excede o limite máximo permitido de 15 MB." },
        { status: 413 }
      );
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    // 1. Armazenamento Resiliente do PDF (Supabase -> Vercel Blob -> Servidor Local)
    const { url: resumeUrl, provider } = await uploadResumeBuffer(buffer, file.name);

    // 2. Extração do Texto do PDF
    const rawText = await extractTextFromPdfBuffer(buffer);

    // 3. Extração Inteligente dos Dados (Heurística de Alta Precisão + IA com Fallback)
    const parsedData = await parseResumeWithAi(rawText);

    return NextResponse.json(
      {
        success: true,
        resumeUrl,
        storageProvider: provider,
        name: parsedData.name,
        firstName: parsedData.firstName,
        lastName: parsedData.lastName,
        email: parsedData.email,
        phone: parsedData.phone,
        linkedinUrl: parsedData.linkedinUrl,
        skills: parsedData.skills,
        tags: parsedData.tags,
        profileSummary: parsedData.profileSummary,
        salaryExpectation: parsedData.salaryExpectation,
        rawText: parsedData.rawText,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Erro definitivo no processamento de currículo:", err);
    return NextResponse.json(
      {
        error: err.message || "Erro inesperado ao processar o currículo.",
      },
      { status: 500 }
    );
  }
}
