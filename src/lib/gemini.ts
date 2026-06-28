const KEY_ENV_NAMES = [
  "GEMINI_API_KEY",
  "GEMINI_API_KEY_2",
  "GEMINI_API_KEY_3",
  "GEMINI_API_KEY_4",
  "GEMINI_API_KEY_5",
  "GEMINI_API_KEY_6",
  "GEMINI_API_KEY_7",
  "GEMINI_API_KEY_8",
  "GEMINI_API_KEY_9",
  "GEMINI_API_KEY_10",
];

export function pickGeminiKey(): string | undefined {
  const keys = KEY_ENV_NAMES.map((name) => process.env[name]?.trim()).filter(Boolean) as string[];
  if (keys.length === 0) return undefined;
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getAllGeminiKeys(): string[] {
  return KEY_ENV_NAMES.map((name) => process.env[name]?.trim()).filter(Boolean) as string[];
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isRetryableKeyError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  // Pula para a próxima chave em: cota esgotada OU autenticação inválida
  // Chaves AQ. são OAuth tokens temporários que expiram — auth error = chave inválida, tenta próxima
  const isQuota = msg.includes("429") || lower.includes("resource_exhausted") || lower.includes("quota");
  const isAuth = msg.includes("401") || msg.includes("403") || lower.includes("permission_denied") || lower.includes("unauthenticated") || lower.includes("api_key_invalid");
  return isQuota || isAuth;
}

/**
 * Tenta fn() com cada chave Gemini disponível em ordem aleatória.
 * Avança para a próxima chave em erro de cota (429) ou auth (401/403/API_KEY_INVALID).
 * Erros de payload ou provider lançam imediatamente.
 */
export async function withGeminiKeyRotation<T>(
  fn: (apiKey: string) => Promise<T>,
): Promise<T> {
  const keys = getAllGeminiKeys();
  if (keys.length === 0) throw new Error("Nenhuma chave Gemini configurada.");

  const ordered = shuffled(keys);
  let lastError: unknown;

  for (const key of ordered) {
    try {
      return await fn(key);
    } catch (error) {
      lastError = error;
      if (!isRetryableKeyError(error)) throw error;
    }
  }

  throw lastError;
}
