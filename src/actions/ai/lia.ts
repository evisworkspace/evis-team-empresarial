"use server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `Você é um assistente de triagem de leads para uma construtora.
Analise a conversa abaixo e extraia as informações do cliente interessado.
Responda APENAS com JSON válido, sem markdown, sem blocos de código, sem explicação.
Formato obrigatório:
{"nome":"string","telefone":"string","narrativa":"string"}

nome: nome do cliente ou contato
telefone: número com DDD, apenas dígitos, ou string vazia se não encontrado
narrativa: resumo objetivo do que o cliente quer (máx 200 chars) Se não encontrar algum campo, use string vazia.`;

export type TriagemResult =
  | { ok: true; data: { nome: string; telefone: string; narrativa: string } }
  | { ok: false; error: string };

export async function analisarTexto(texto: string): Promise<TriagemResult> {
  if (!texto || texto.trim().length < 10) {
    return { ok: false, error: "Texto muito curto para análise." };
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Chave da API Gemini não configurada." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: texto.trim(),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            nome: { type: "string" },
            telefone: { type: "string" },
            narrativa: { type: "string" },
          },
          required: ["nome", "telefone", "narrativa"],
        },
      },
    });

    const raw = response.text ?? "";
    const parsed = JSON.parse(raw) as { nome: string; telefone: string; narrativa: string };

    return {
      ok: true,
      data: {
        nome: parsed.nome ?? "",
        telefone: parsed.telefone ?? "",
        narrativa: (parsed.narrativa ?? "").slice(0, 200),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado na análise.";
    return { ok: false, error: message };
  }
}
