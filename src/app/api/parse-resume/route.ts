/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  try {
    const pdfParse = require("pdf-parse");
    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read PDF
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    // Simple Regex Heuristics
    const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
    const phoneMatch = text.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})[-.\s]?\d{4}/);
    
    // Naive name extraction: grab first few lines, find the first one that looks like a name
    const lines = String(text).split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    let name = "";
    for (const line of lines.slice(0, 5)) {
      if (line.split(" ").length >= 2 && !line.includes("@") && line.length < 50) {
        name = line;
        break;
      }
    }

    return NextResponse.json({
      name: name,
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      rawText: text.substring(0, 1000) + "..." // For debugging or profile summary
    });
  } catch (error) {
    console.error("Parse Error:", error);
    return NextResponse.json({ error: "Erro ao processar currículo." }, { status: 500 });
  }
}
