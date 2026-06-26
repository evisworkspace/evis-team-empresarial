"use server";

import { redirect } from "next/navigation";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `Você é o assistente operacional do EVIS, sistema de gestão para construtoras.

Analise a entrada abaixo (texto, conversa, relato, mensagem de WhatsApp ou narração) e extraia as informações para criar uma nova oportunidade comercial.

Regras obrigatórias:
- Não invente informações. Extraia só o que está explícito ou fortemente implícito no texto.
- Se um campo não puder ser determinado com confiança, use string vazia ou 0.
- tipoObra: use apenas residencial | comercial | industrial | reforma | outro — ou string vazia.
- origem: use apenas indicacao | instagram | facebook | site | whatsapp | ligacao | outro — ou string vazia. Detecte pelo contexto: conversa de WhatsApp → whatsapp, mencionou amigo/conhecido → indicacao, etc.
- prioridade: use apenas baixa | media | alta | urgente — ou string vazia. Urgente se houver prazo imediato.
- pendencias: liste em português o que faltou na entrada e precisa ser confirmado pelo usuário antes de salvar. Ex: "Endereço da obra não mencionado", "Prazo não definido".
- titulo: nome curto e objetivo para identificar a oportunidade. Ex: "Reforma Apartamento — Pedro", "Construção Residência Silva".
- descricao: narrativa completa preservando o contexto original. Pode ser longa.`;

interface ExtracaoOportunidade {
  titulo: string;
  descricao: string;
  tipoObra: string;
  origem: string;
  prioridade: string;
  metragemEstimada: number;
  valorEstimado: number;
  clienteNome: string;
  clienteTelefone: string;
  pendencias: string[];
}

export async function preencherOportunidadeComAgente(formData: FormData) {
  const texto = ((formData.get("texto_captura") as string) ?? "").trim();
  const stage = (formData.get("stage") as string) || "oportunidade";
  const base = `/dashboard/projetos/novo?stage=${stage}`;

  if (!texto || texto.length < 10) {
    redirect(`${base}&erro=${encodeURIComponent("Texto muito curto para análise.")}`);
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    redirect(`${base}&erro=${encodeURIComponent("API Gemini não configurada.")}`);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: texto,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            descricao: { type: "string" },
            tipoObra: { type: "string" },
            origem: { type: "string" },
            prioridade: { type: "string" },
            metragemEstimada: { type: "number" },
            valorEstimado: { type: "number" },
            clienteNome: { type: "string" },
            clienteTelefone: { type: "string" },
            pendencias: { type: "array", items: { type: "string" } },
          },
          required: [
            "titulo", "descricao", "tipoObra", "origem", "prioridade",
            "metragemEstimada", "valorEstimado", "clienteNome", "clienteTelefone", "pendencias",
          ],
        },
      },
    });

    const data = JSON.parse(response.text ?? "{}") as ExtracaoOportunidade;

    const p = new URLSearchParams();
    p.set("stage", stage);
    p.set("agenteFilled", "1");
    if (data.titulo) p.set("titulo", data.titulo);
    if (data.descricao) p.set("descricao", data.descricao.slice(0, 1500));
    if (data.tipoObra) p.set("tipoObra", data.tipoObra);
    if (data.origem) p.set("origem", data.origem);
    if (data.prioridade) p.set("prioridade", data.prioridade);
    if (data.metragemEstimada > 0) p.set("metragem", String(data.metragemEstimada));
    if (data.valorEstimado > 0) p.set("valor", String(data.valorEstimado));
    if (data.clienteNome) p.set("clienteNome", data.clienteNome);
    if (data.clienteTelefone) p.set("clienteTel", data.clienteTelefone);
    if (data.pendencias?.length > 0) p.set("pendencias", data.pendencias.join(" · "));

    redirect(`/dashboard/projetos/novo?${p.toString()}`);
  } catch {
    redirect(`${base}&erro=${encodeURIComponent("Erro na análise. Tente novamente.")}`);
  }
}
