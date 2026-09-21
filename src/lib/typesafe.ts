import { TypeSafeClient, choice, score, noul } from "@typesafe-ai/sdk";

let clientInstance: TypeSafeClient | null = null;

/**
 * Retorna uma instância singleton do TypeSafeClient configurada com a chave de API do ambiente.
 * Retorna null caso a chave TYPESAFE_API_KEY não esteja definida.
 */
export function getTypeSafeClient(): TypeSafeClient | null {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }

  if (!clientInstance) {
    clientInstance = new TypeSafeClient({
      apiKey: apiKey.trim(),
      timeout: 8000, // Timeout seguro de 8 segundos
    });
  }

  return clientInstance;
}

/**
 * Verifica se a integração com TypeSafe AI está devidamente configurada no ambiente.
 */
export function isTypeSafeConfigured(): boolean {
  const apiKey = process.env.TYPESAFE_API_KEY;
  return Boolean(apiKey && apiKey.trim().length > 0);
}

export { choice, score, noul, TypeSafeClient };
