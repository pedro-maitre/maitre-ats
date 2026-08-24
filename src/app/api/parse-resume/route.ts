import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yqnlcwglyxqsemqhjkmp.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key);
}

/**
 * Ensure that the "resumes" bucket exists.
 * Only attempts creation if a service role client is available.
 */
async function ensureResumesBucket(): Promise<void> {
  const supabaseService = getServiceSupabase();
  if (!supabaseService) {
    // Anon client does not have bucket admin permissions, but can upload to the public 'resumes' bucket directly.
    return;
  }

  try {
    const { data, error } = await supabaseService.storage.getBucket("resumes");
    if (error && error.message.includes("Bucket not found")) {
      const { error: createErr } = await supabaseService.storage.createBucket("resumes", {
        public: true,
      });
      if (createErr) {
        console.error("Failed to create Supabase bucket:", createErr);
      }
    }
  } catch (err) {
    console.warn("Could not check/create bucket via service role:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("resume") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Arquivo PDF não fornecido" }, { status: 400 });
    }

    // Limit size (optional)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF maior que 10 MB" }, { status: 413 });
    }

    // Ensure bucket exists before uploading
    await ensureResumesBucket();

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    console.log("Received file size:", file.size, "ArrayBuffer byteLength:", arrayBuf.byteLength, "Header:", buffer.subarray(0, 30).toString());

    // Choose storage client: use service role client if available (has write permissions), otherwise fall back to anon client
    const supabaseService = getServiceSupabase();
    const storageClient = supabaseService ?? supabase;

    // Upload PDF to Supabase storage bucket 'resumes'
    const filename = `${randomUUID()}.pdf`;
    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from("resumes")
      .upload(filename, buffer, {
        contentType: "application/pdf",
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const resumeUrl = storageClient.storage.from("resumes").getPublicUrl(filename).data.publicUrl;
    
    // Parse PDF text with resilient fallback
    let raw = "";
    try {
      const data = await pdf(buffer, { version: "v2.0.550" });
      raw = data.text || "";
    } catch (pdfErr) {
      console.warn("Could not extract text from PDF (might be an image or protected format):", pdfErr);
      try {
        const fallbackData = await pdf(buffer);
        raw = fallbackData.text || "";
      } catch {
        // Ignore fallback error, keep raw as empty string
      }
    }

    // Very simple heuristic – split the first line for name, look for email/phone patterns
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    const nameLine = lines[0] || "";
    const emailMatch = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const phoneMatch = raw.match(/\+?\d[\d\s().-]{7,}\d/);

    return NextResponse.json(
      {
        name: nameLine.trim(),
        email: emailMatch?.[0] || "",
        phone: phoneMatch?.[0] || "",
        rawText: raw,
        resumeUrl,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Parse resume error:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao processar PDF" },
      { status: 500 }
    );
  }
}
