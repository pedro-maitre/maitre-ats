import { createClient } from "@supabase/supabase-js";
import { randomUUID, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

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
 * Ensures bucket exists in Supabase Storage.
 */
async function ensureBucket(client: any, bucketName: string = "resumes"): Promise<void> {
  try {
    const { error } = await client.storage.getBucket(bucketName);
    if (error && error.message?.includes("not found")) {
      await client.storage.createBucket(bucketName, {
        public: true, // Ou privado com URLs assinadas
      });
    }
  } catch (err) {
    // Ignore bucket check failure and proceed
  }
}

export interface UploadDocumentParams {
  buffer: Buffer;
  originalFilename?: string;
  organizationId?: string;
  candidateId?: string;
  classification?: "CURRICULO" | "LAUDO" | "DIPLOMA" | "CERTIFICADO";
}

export interface UploadDocumentResult {
  url: string;
  documentId?: string;
  storageKey: string;
  checksum: string;
  provider: "supabase";
}

/**
 * Upload seguro de documentos e currículos para o Supabase Storage Canônico.
 * Calcula checksum SHA-256 e cria registro de metadados em Document.
 */
export async function uploadSecureDocument(
  params: UploadDocumentParams
): Promise<UploadDocumentResult> {
  const { buffer, originalFilename, organizationId, candidateId, classification = "CURRICULO" } = params;

  const extension = originalFilename?.split(".").pop() || "pdf";
  const cleanExtension = extension.toLowerCase() === "pdf" ? "pdf" : "pdf";
  const storageKey = `${organizationId || "global"}/${candidateId || "temp"}/${randomUUID()}.${cleanExtension}`;
  const checksum = createHash("sha256").update(buffer).digest("hex");

  const serviceClient = getServiceSupabase();
  const storageClient = serviceClient || getAnonSupabase();

  if (serviceClient) {
    await ensureBucket(serviceClient, "resumes");
  }

  const { data, error } = await storageClient.storage
    .from("resumes")
    .upload(storageKey, buffer, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage Upload Error:", error.message);
    throw new Error(`Falha no upload do arquivo para o storage: ${error.message}`);
  }

  // Gera URL canônica (ou URL assinada temporária)
  const publicUrl = storageClient.storage.from("resumes").getPublicUrl(storageKey).data.publicUrl;

  // Se tivermos organizationId, persiste metadados em Document
  let documentRecord: any = null;
  if (organizationId) {
    try {
      documentRecord = await prisma.document.create({
        data: {
          organizationId,
          candidateId: candidateId || undefined,
          provider: "SUPABASE_PRIVATE",
          bucket: "resumes",
          storageKey,
          originalName: originalFilename || "curriculo.pdf",
          mimeType: "application/pdf",
          sizeBytes: buffer.length,
          checksum,
          classification,
        },
      });
    } catch (dbErr: any) {
      console.warn("Aviso: Não foi possível salvar registro Document no banco:", dbErr.message);
    }
  }

  return {
    url: publicUrl,
    documentId: documentRecord?.id,
    storageKey,
    checksum,
    provider: "supabase",
  };
}

/**
 * Gera uma URL assinada de curta duração para download/visualização segura de documento.
 */
export async function getSignedDocumentUrl(
  storageKey: string,
  expiresInSeconds: number = 900 // 15 minutos padrão
): Promise<string> {
  const serviceClient = getServiceSupabase();
  const storageClient = serviceClient || getAnonSupabase();

  const { data, error } = await storageClient.storage
    .from("resumes")
    .createSignedUrl(storageKey, expiresInSeconds);

  if (error || !data?.signedUrl) {
    // Fallback para public URL caso o bucket seja público
    return storageClient.storage.from("resumes").getPublicUrl(storageKey).data.publicUrl;
  }

  return data.signedUrl;
}

/**
 * Compatibilidade legada para rotas que chamam uploadResumeBuffer
 */
export async function uploadResumeBuffer(
  buffer: Buffer,
  originalFilename?: string,
  organizationId?: string,
  candidateId?: string
): Promise<{ url: string; provider: "supabase"; documentId?: string }> {
  const result = await uploadSecureDocument({
    buffer,
    originalFilename,
    organizationId,
    candidateId,
  });

  return {
    url: result.url,
    provider: "supabase",
    documentId: result.documentId,
  };
}
