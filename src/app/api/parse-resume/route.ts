/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Use OpenAI to parse the text
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é um assistente especialista em recrutamento. 
Extraia as seguintes informações do currículo fornecido e retorne APENAS um JSON válido com esta estrutura exata:
{
  "name": "Nome Completo (ou apenas o primeiro e último nome)",
  "email": "E-mail do candidato",
  "phone": "Telefone do candidato no formato numérico",
  "linkedinUrl": "URL do LinkedIn (se houver)",
  "tags": ["Tag1", "Tag2", "Tag3"], // Máximo de 8 competências chave (hard skills e ferramentas)
  "profileSummary": "Um resumo profissional coeso de no máximo 4 linhas criado a partir do currículo"
}
Se uma informação não existir, retorne string vazia "". Se tags não existirem, retorne [].`
        },
        {
          role: "user",
          content: text.substring(0, 10000) // Limit size to avoid excessive tokens
        }
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0].message.content;
    
    if (!aiResponse) {
      throw new Error("Resposta vazia da IA");
    }

    const parsedData = JSON.parse(aiResponse);

    return NextResponse.json({
      name: parsedData.name || "",
      email: parsedData.email || "",
      phone: parsedData.phone || "",
      linkedinUrl: parsedData.linkedinUrl || "",
      rawText: parsedData.profileSummary || "",
      tags: parsedData.tags ? parsedData.tags.join(", ") : ""
    });
  } catch (error) {
    console.error("Parse Error:", error);
    return NextResponse.json({ error: "Erro ao processar currículo." }, { status: 500 });
  }
}
