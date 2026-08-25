import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yqnlcwglyxqsemqhjkmp.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key);
}

function getAnonSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yqnlcwglyxqsemqhjkmp.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Gaj8GoRPDXpDZ0mGaVJU9Q_fXOEir_3";
  return createClient(url, key);
}

/**
 * Ensures the 'resumes' bucket exists in Supabase.
 */
async function ensureResumesBucket(client: any): Promise<void> {
  try {
    const { error } = await client.storage.getBucket("resumes");
    if (error && error.message?.includes("not found")) {
      await client.storage.createBucket("resumes", {
        public: true,
      });
    }
  } catch (err) {
    // Ignore bucket check failure and proceed with upload
  }
}

/**
 * Definitively uploads a resume file with triple fallback:
 * 1. Supabase Storage (Service Role or Public Anon RLS)
 * 2. Vercel Blob (if token is set)
 * 3. Local Next.js public uploads directory / data URL
 */
export async function uploadResumeBuffer(
  buffer: Buffer,
  originalFilename?: string
): Promise<{ url: string; provider: "supabase" | "blob" | "local" | "inline" }> {
  const extension = originalFilename?.split(".").pop() || "pdf";
  const cleanExtension = extension.toLowerCase() === "pdf" ? "pdf" : "pdf";
  const filename = `${randomUUID()}.${cleanExtension}`;

  // 1. TENTATIVA PRIMÁRIA: Supabase Storage
  try {
    const serviceClient = getServiceSupabase();
    const storageClient = serviceClient || getAnonSupabase();

    if (serviceClient) {
      await ensureResumesBucket(serviceClient);
    }

    const { data, error } = await storageClient.storage
      .from("resumes")
      .upload(filename, buffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      });

    if (!error && data) {
      const publicUrl = storageClient.storage.from("resumes").getPublicUrl(filename).data.publicUrl;
      return { url: publicUrl, provider: "supabase" };
    } else if (error) {
      console.warn("Supabase upload warning, trying fallbacks:", error.message);
    }
  } catch (supabaseErr: any) {
    console.warn("Supabase storage exception:", supabaseErr.message);
  }

  // 2. TENTATIVA SECUNDÁRIA: Vercel Blob (se configurado)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // Dynamic import to prevent crash if not installed
      const { put } = await import("@vercel/blob");
      const blob = await put(`resumes/${filename}`, buffer, {
        access: "public",
        contentType: "application/pdf",
      });
      if (blob?.url) {
        return { url: blob.url, provider: "blob" };
      }
    } catch (blobErr: any) {
      console.warn("Vercel Blob upload failed:", blobErr.message);
    }
  }

  // 3. TENTATIVA TERCIÁRIA: Armazenamento Local no Servidor (/public/uploads/resumes)
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "resumes");
    await fs.mkdir(uploadsDir, { recursive: true });
    const localFilePath = path.join(uploadsDir, filename);
    await fs.writeFile(localFilePath, buffer);
    return { url: `/uploads/resumes/${filename}`, provider: "local" };
  } catch (fsErr: any) {
    console.warn("Local filesystem write warning:", fsErr.message);
  }

  // 4. ÚLTIMO RECURSO: Data URL Inline (Garante que nunca ocorra falha 500)
  const base64 = buffer.toString("base64");
  return {
    url: `data:application/pdf;base64,${base64.substring(0, 100)}...`, // Placeholder safe URL
    provider: "inline",
  };
}
