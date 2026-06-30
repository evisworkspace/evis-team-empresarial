"use server";

import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withGeminiKeyRotation } from "@/lib/gemini";
import { getEmpresaId } from "@/lib/tenant";

export interface RdiOutput {
  titulo: string;
  resumo: string;
  registroInterno: {
    ativo: boolean;
    conteudo: string;
  };
  rdoPublicavel: {
    ativo: boolean;
    descricao: string;
  };
  mensagens: Array<{
    destinatarioTipo: string;
    destinatarioNome: string;
    canalSugerido: string;
    objetivo: string;
    textoRascunho: string;
    origem: string;
  }>;
  tarefasSugeridas: string[];
  agendaSugerida: Array<{
    titulo: string;
    tipo: string;
    descricao: string;
    dataHoraSugerida: string;
  }>;
  anotacaoFormal: {
    ativo: boolean;
    tipo: string;
    titulo: string;
    conteudo: string;
  };
}

export type ProcessarRdiResult =
  | { ok: true; data: RdiOutput }
  | { ok: false; error: string };

export interface ProcessarRdiInput {
  narrativa: string;
  projetoId: string;
}

const SYSTEM_PROMPT = `Você é um analisador semântico de narrativas operacionais para obras e oportunidades de construção civil.

Sua função: ler a narrativa do gestor e extrair blocos estruturados por destino operacional.

BLOCOS DE SAÍDA:

1. registroInterno — contexto interno, bastidor, premissas, decisões, dúvidas operacionais
   ativo: true se houver qualquer conteúdo relevante (quase sempre true)
   conteudo: texto em prosa completo. Inclui fatos, premissas, pendências, riscos e decisões internas

2. rdoPublicavel — Diário de Obra, apenas fatos objetivos de execução já confirmados
   ativo: true SOMENTE se houver execução física, medição, entrega ou ocorrência de obra confirmada
   descricao: entrada concisa (1-3 frases) para o registro público da obra

3. mensagens — rascunhos de comunicação pendente
   Incluir SOMENTE se a narrativa indicar necessidade de comunicação para cliente, fornecedor ou equipe
   destinatarioTipo: "cliente" | "fornecedor" | "equipe" | "outro"
   canalSugerido: "whatsapp" | "email" | "telefone" | "interno"
   objetivo: "confirmacao" | "devolutiva" | "pedido_informacao" | "follow_up" | "alinhamento"
   textoRascunho: mensagem editável, linguagem natural, NUNCA markdown
   origem: trecho da narrativa que motivou a mensagem

4. tarefasSugeridas — próximas ações executáveis ainda não realizadas

5. agendaSugerida — compromissos futuros quando mencionados
   tipo: "visita" | "reuniao" | "follow_up" | "prazo"
   dataHoraSugerida: ISO 8601 se data mencionada, string vazia "" se desconhecida

6. anotacaoFormal — documento técnico formal (relatório de visita, levantamento, vistoria, entrega)
   ativo: true SOMENTE se a narrativa for ou descrever um documento técnico formal
   tipo: "relatorio_visita" | "levantamento" | "entrega" | "outro"
   titulo: título do documento

REGRAS:
- titulo: inferir do conteúdo, nunca genérico
- Preservar literalmente: valores, datas, nomes, endereços mencionados na narrativa
- Nunca inventar informação não presente na narrativa
- PROIBIDO: markdown em qualquer campo de texto
- rdoPublicavel.ativo = false para bastidor, premissas ou informações não confirmadas
- mensagens: lista vazia se não houver comunicação pendente implícita`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    resumo: { type: "string" },
    registroInterno: {
      type: "object",
      properties: {
        ativo: { type: "boolean" },
        conteudo: { type: "string" },
      },
    },
    rdoPublicavel: {
      type: "object",
      properties: {
        ativo: { type: "boolean" },
        descricao: { type: "string" },
      },
    },
    mensagens: {
      type: "array",
      items: {
        type: "object",
        properties: {
          destinatarioTipo: { type: "string" },
          destinatarioNome: { type: "string" },
          canalSugerido: { type: "string" },
          objetivo: { type: "string" },
          textoRascunho: { type: "string" },
          origem: { type: "string" },
        },
      },
    },
    tarefasSugeridas: {
      type: "array",
      items: { type: "string" },
    },
    agendaSugerida: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          tipo: { type: "string" },
          descricao: { type: "string" },
          dataHoraSugerida: { type: "string" },
        },
      },
    },
    anotacaoFormal: {
      type: "object",
      properties: {
        ativo: { type: "boolean" },
        tipo: { type: "string" },
        titulo: { type: "string" },
        conteudo: { type: "string" },
      },
    },
  },
  required: [
    "titulo",
    "resumo",
    "registroInterno",
    "rdoPublicavel",
    "mensagens",
    "tarefasSugeridas",
    "agendaSugerida",
    "anotacaoFormal",
  ],
};

export async function processarRdi(input: ProcessarRdiInput): Promise<ProcessarRdiResult> {
  const narrativa = input.narrativa?.trim() ?? "";
  const projetoId = input.projetoId?.trim() ?? "";

  if (!narrativa || narrativa.length < 20) {
    return { ok: false, error: "Narrativa muito curta. Descreva o contexto com mais detalhes." };
  }
  if (!projetoId) {
    return { ok: false, error: "Projeto não identificado. Abra um projeto antes de usar o Registro." };
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
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  `Projeto: ${projeto.titulo}`,
                  `Stage: ${projeto.stage}`,
                  "",
                  "Narrativa operacional:",
                  narrativa,
                ].join("\n"),
              },
            ],
          },
        ],
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
      titulo: parsed.titulo?.trim() || "Registro Operacional",
      resumo: parsed.resumo?.trim() || "",
      registroInterno: {
        ativo: parsed.registroInterno?.ativo !== false,
        conteudo: parsed.registroInterno?.conteudo?.trim() || narrativa,
      },
      rdoPublicavel: {
        ativo: parsed.rdoPublicavel?.ativo === true,
        descricao: parsed.rdoPublicavel?.descricao?.trim() || "",
      },
      mensagens: Array.isArray(parsed.mensagens)
        ? parsed.mensagens
            .filter((m) => m?.textoRascunho?.trim())
            .map((m) => ({
              destinatarioTipo: m.destinatarioTipo?.trim() || "outro",
              destinatarioNome: m.destinatarioNome?.trim() || "—",
              canalSugerido: m.canalSugerido?.trim() || "whatsapp",
              objetivo: m.objetivo?.trim() || "alinhamento",
              textoRascunho: m.textoRascunho?.trim() || "",
              origem: m.origem?.trim() || "",
            }))
        : [],
      tarefasSugeridas: Array.isArray(parsed.tarefasSugeridas)
        ? parsed.tarefasSugeridas.filter(Boolean).map((s) => String(s).trim())
        : [],
      agendaSugerida: Array.isArray(parsed.agendaSugerida)
        ? parsed.agendaSugerida
            .filter((a) => a?.titulo?.trim())
            .map((a) => ({
              titulo: a.titulo?.trim() || "",
              tipo: a.tipo?.trim() || "compromisso",
              descricao: a.descricao?.trim() || "",
              dataHoraSugerida: a.dataHoraSugerida?.trim() || "",
            }))
        : [],
      anotacaoFormal: {
        ativo: parsed.anotacaoFormal?.ativo === true,
        tipo: parsed.anotacaoFormal?.tipo?.trim() || "outro",
        titulo: parsed.anotacaoFormal?.titulo?.trim() || "",
        conteudo: parsed.anotacaoFormal?.conteudo?.trim() || "",
      },
    };

    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao processar narrativa.";
    console.error("[processarRdi]", message);
    return { ok: false, error: `Erro ao processar: ${message}` };
  }
}
