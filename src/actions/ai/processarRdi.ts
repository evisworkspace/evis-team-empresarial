"use server";

import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withGeminiKeyRotation } from "@/lib/gemini";
import { getEmpresaId } from "@/lib/tenant";

export interface RdiOutput {
  titulo: string;
  resumo: string;
  fatos: string[];
  premissas: string[];
  pendencias: string[];
  escopo: string[];
  riscos: string[];
  proximosPassos: string[];
  tarefasSugeridas: string[];
  anotacaoRascunho: string;
  diarioRascunho: string;
}

export type ProcessarRdiResult =
  | { ok: true; data: RdiOutput }
  | { ok: false; error: string };

export interface ProcessarRdiInput {
  narrativa: string;
  projetoId: string;
}

const SYSTEM_PROMPT = `Você é um analisador semântico de narrativas operacionais para obras e oportunidades de construção civil.

Sua função: ler a narrativa enviada pelo gestor e extrair estrutura operacional limpa.

REGRAS:
- Separar sempre fatos confirmados de premissas e pendências
- Nunca inventar informação que não está na narrativa
- Tarefas sugeridas devem ser ações concretas e executáveis, não abstrações
- proximosPassos é o que o gestor ou a equipe devem fazer após esta narrativa
- anotacaoRascunho deve ser um texto completo, em prosa, adequado para ficar no histórico do projeto
- diarioRascunho deve ser conciso (1-3 frases) para a entrada no Diário de Obra
- titulo deve ser inferido do conteúdo — nunca genérico como "Narrativa do projeto"
- Se a narrativa mencionar valores, datas, nomes ou endereços, preservar literalmente
- Classificar: o que é fato (já ocorreu/está confirmado), o que é premissa (assumido mas não confirmado), o que é pendência (precisa de resposta/decisão)

PROIBIDO:
- Inventar fatos não mencionados
- Reduzir pendências que o gestor mencionou
- Misturar fato com premissa
- Usar markdown — retornar JSON puro`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    resumo: { type: "string" },
    fatos: { type: "array", items: { type: "string" } },
    premissas: { type: "array", items: { type: "string" } },
    pendencias: { type: "array", items: { type: "string" } },
    escopo: { type: "array", items: { type: "string" } },
    riscos: { type: "array", items: { type: "string" } },
    proximosPassos: { type: "array", items: { type: "string" } },
    tarefasSugeridas: { type: "array", items: { type: "string" } },
    anotacaoRascunho: { type: "string" },
    diarioRascunho: { type: "string" },
  },
  required: [
    "titulo", "resumo", "fatos", "premissas", "pendencias",
    "escopo", "riscos", "proximosPassos", "tarefasSugeridas",
    "anotacaoRascunho", "diarioRascunho",
  ],
};

export async function processarRdi(input: ProcessarRdiInput): Promise<ProcessarRdiResult> {
  const narrativa = input.narrativa?.trim() ?? "";
  const projetoId = input.projetoId?.trim() ?? "";

  if (!narrativa?.trim() || narrativa.trim().length < 20) {
    return { ok: false, error: "Narrativa muito curta. Descreva o contexto com mais detalhes." };
  }
  if (!projetoId) {
    return { ok: false, error: "Projeto não identificado. Abra um projeto antes de usar o RDI." };
  }

  try {
    const session = await auth();
    const empresaId = getEmpresaId(session);
    const projeto = await prisma.projeto.findFirst({
      where: { id: projetoId, empresaId, deletedAt: null },
      select: { id: true, titulo: true, stage: true },
    });

    if (!projeto) {
      return { ok: false, error: "Projeto não encontrado para esta empresa." };
    }

    const response = await withGeminiKeyRotation(async (apiKey) => {
      const ai = new GoogleGenAI({ apiKey });
      return ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{
            text: [
              `Projeto: ${projeto.titulo}`,
              `Stage: ${projeto.stage}`,
              "",
              "Narrativa operacional:",
              narrativa,
            ].join("\n"),
          }],
        }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      });
    });

    const raw = response.text?.trim();
    if (!raw) throw new Error("Gemini retornou resposta vazia.");

    const parsed = JSON.parse(raw) as Partial<RdiOutput>;
    const data: RdiOutput = {
      titulo: parsed.titulo?.trim() || "RDI - Diario de Gestao Interna",
      resumo: parsed.resumo?.trim() || "",
      fatos: Array.isArray(parsed.fatos) ? parsed.fatos.filter(Boolean) : [],
      premissas: Array.isArray(parsed.premissas) ? parsed.premissas.filter(Boolean) : [],
      pendencias: Array.isArray(parsed.pendencias) ? parsed.pendencias.filter(Boolean) : [],
      escopo: Array.isArray(parsed.escopo) ? parsed.escopo.filter(Boolean) : [],
      riscos: Array.isArray(parsed.riscos) ? parsed.riscos.filter(Boolean) : [],
      proximosPassos: Array.isArray(parsed.proximosPassos) ? parsed.proximosPassos.filter(Boolean) : [],
      tarefasSugeridas: Array.isArray(parsed.tarefasSugeridas) ? parsed.tarefasSugeridas.filter(Boolean) : [],
      anotacaoRascunho: parsed.anotacaoRascunho?.trim() || narrativa,
      diarioRascunho: parsed.diarioRascunho?.trim() || parsed.resumo?.trim() || narrativa.slice(0, 500),
    };

    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao processar narrativa.";
    console.error("[processarRdi]", message);
    return { ok: false, error: `Erro ao processar: ${message}` };
  }
}
