const KEY_ENV_NAMES = [
  "GROQ_API_KEY",
  "GROQ_API_KEY_2",
  "GROQ_API_KEY_3",
  "GROQ_API_KEY_4",
  "GROQ_API_KEY_5",
  "GROQ_API_KEY_6",
  "GROQ_API_KEY_7",
  "GROQ_API_KEY_8",
  "GROQ_API_KEY_9",
  "GROQ_API_KEY_10",
];

export function getAllGroqKeys(): string[] {
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

export function isGroqQuotaError(error: unknown): boolean {
  const record = asRecord(error);
  const nested = asRecord(record?.error);
  const status = typeof record?.status === "number" ? record.status : undefined;
  const code = typeof nested?.code === "string" ? nested.code : typeof record?.code === "string" ? record.code : "";
  const message = error instanceof Error ? error.message : String(error);
  const normalized = `${code} ${message}`.toLowerCase();

  return (
    status === 429 ||
    normalized.includes("429") ||
    normalized.includes("rate_limit_exceeded") ||
    normalized.includes("quota")
  );
}

/**
 * Tenta fn() com cada chave Groq disponível em ordem aleatória.
 * Só avança para a próxima chave em erros de cota/rate limit.
 * Erros de outro tipo lançam imediatamente.
 */
export async function withGroqKeyRotation<T>(
  fn: (apiKey: string) => Promise<T>,
): Promise<T> {
  const keys = getAllGroqKeys();
  if (keys.length === 0) throw new Error("Nenhuma chave Groq configurada.");

  const ordered = shuffled(keys);
  let lastError: unknown;

  for (const key of ordered) {
    try {
      return await fn(key);
    } catch (error) {
      lastError = error;
      if (!isGroqQuotaError(error)) throw error;
    }
  }

  throw lastError;
}
