const KEY_ENV_NAMES = [
  "GEMINI_API_KEY",
  "GEMINI_API_KEY_2",
  "GEMINI_API_KEY_3",
  "GEMINI_API_KEY_4",
  "GEMINI_API_KEY_5",
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

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("429") || msg.toLowerCase().includes("resource_exhausted") || msg.toLowerCase().includes("quota");
}

/**
 * Tenta fn() com cada chave Gemini disponível em ordem aleatória.
 * Só avança para a próxima chave em erros de cota (429/RESOURCE_EXHAUSTED).
 * Erros de outro tipo lançam imediatamente.
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
      if (!isQuotaError(error)) throw error;
    }
  }

  throw lastError;
}
