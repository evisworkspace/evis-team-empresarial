"use server";

import { redirect } from "next/navigation";
import { createPartFromBase64, GoogleGenAI, type Part } from "@google/genai";
import { pickGeminiKey } from "@/lib/gemini";

const SYSTEM_PROMPT = `Você é a Lia, secretária operacional da EVIS.

Analise a entrada abaixo — pode ser uma conversa de WhatsApp, relato de visita, lista de tarefas, nota de voz transcrita, documento, print ou qualquer informação operacional.

Extraia TODOS os itens práticos identificados e classifique cada um.

TIPOS disponíveis:
- tarefa: ação que precisa ser feita, sem data específica clara
- agenda: compromisso no calendário do usuário — visita futura, reunião, ligação combinada, follow-up, prazo, retorno a cliente, entrega programada ou lembrete com horário
- visita_tecnica: vistoria, levantamento, medição ou inspeção em obra — fato técnico de campo, constatação ou escopo observado
- reuniao: reunião formal identificada; se tiver data/hora, prefira agenda
- nota: informação relevante, constatação, contexto de projeto
- lead: menção a um novo cliente interessado, nova obra ou oportunidade comercial
- financeiro: valor, pagamento, custo, boleto, PIX mencionado
- documento: arquivo, planta, foto, memorial mencionado

Para cada item extraído:
- titulo: frase curta e objetiva (máx 100 chars, sem markdown)
- descricao: conteúdo completo e útil
- tipo_dispatch: um dos tipos acima
- projeto_mencionado: nome do projeto/obra se mencionado, vazio se não
- data_sugerida: YYYY-MM-DD se houver data, vazio se não
- horario_sugerido: HH:MM se houver horário, vazio se não
- confianca: 0.85-0.95 se explícito, 0.65-0.80 se inferido
- motivo: de onde veio este item no texto

REGRAS:
- Extraia o máximo de itens distintos — não comprima dois fatos em um
- Nunca crie o mesmo item duas vezes
- Agenda é estrutura do sistema, não agente. Use agenda sempre que houver compromisso, data, horário, prazo ou follow-up.
- Visita técnica é registro técnico; não use visita_tecnica apenas porque há uma visita futura marcada.
- Exemplo: "visita amanhã às 10h no Sucão" deve gerar agenda e, se útil, uma tarefa de preparação. Não deve virar visita_tecnica.
- Responda em português, zero markdown nos textos
- Se não houver nada relevante, retorne array vazio`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    itens: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          descricao: { type: "string" },
          tipo_dispatch: { type: "string" },
          projeto_mencionado: { type: "string" },
          data_sugerida: { type: "string" },
          horario_sugerido: { type: "string" },
          confianca: { type: "number" },
          motivo: { type: "string" },
        },
        required: [
          "titulo", "descricao", "tipo_dispatch", "projeto_mencionado",
          "data_sugerida", "horario_sugerido", "confianca", "motivo",
        ],
        propertyOrdering: [
          "tipo_dispatch", "titulo", "descricao", "projeto_mencionado",
          "data_sugerida", "horario_sugerido", "confianca", "motivo",
        ],
      },
    },
  },
  required: ["itens"],
  propertyOrdering: ["itens"],
};

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const GEMINI_MODEL_PRIMARY = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_MODEL_FALLBACK = "gemini-2.0-flash";

function isUnavailable(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("503") || msg.includes("UNAVAILABLE");
}

async function chamarGemini(ai: GoogleGenAI, parts: Part[], model: string) {
  const supportsThinking = model.includes("2.5");
  return ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      ...(supportsThinking && { thinkingConfig: { thinkingBudget: 1024 } }),
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });
}

export async function processarEntradaLia(formData: FormData) {
  const texto = ((formData.get("texto_captura") as string) ?? "").trim();
  const imagemFiles = formData
    .getAll("imagem_captura")
    .filter((file): file is File => file instanceof File && file.size > 0);
  const base = "/dashboard/diario";

  if ((!texto || texto.length < 10) && imagemFiles.length === 0) {
    redirect(`${base}?erro=${encodeURIComponent("Informe um texto ou imagem para a Lia analisar.")}`);
  }

  for (const file of imagemFiles) {
    if (!IMAGE_MIME_TYPES.has(file.type)) {
      redirect(`${base}?erro=${encodeURIComponent("Formato não suportado. Use PNG, JPG ou WebP.")}`);
    }
    if (file.size > IMAGE_MAX_BYTES) {
      redirect(`${base}?erro=${encodeURIComponent("Imagem muito grande. Envie até 5 MB por imagem.")}`);
    }
  }

  const apiKey = pickGeminiKey();
  if (!apiKey) {
    redirect(`${base}?erro=${encodeURIComponent("API Gemini não configurada.")}`);
  }

  let redirectTo = base;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const parts: Part[] = [];

    if (texto) {
      parts.push({ text: `Entrada:\n${texto}` });
    }

    for (const image of imagemFiles) {
      const bytes = Buffer.from(await image.arrayBuffer());
      parts.push(createPartFromBase64(bytes.toString("base64"), image.type));
    }

    let response;
    try {
      response = await chamarGemini(ai, parts, GEMINI_MODEL_PRIMARY);
    } catch (error) {
      if (isUnavailable(error) && GEMINI_MODEL_PRIMARY !== GEMINI_MODEL_FALLBACK) {
        console.warn(
          `[LiaDispatch] Modelo ${GEMINI_MODEL_PRIMARY} indisponível, tentando ${GEMINI_MODEL_FALLBACK}`,
        );
        response = await chamarGemini(ai, parts, GEMINI_MODEL_FALLBACK);
      } else {
        throw error;
      }
    }

    const raw = response.text?.trim();
    if (!raw) throw new Error("Lia returned empty response");

    const parsed = JSON.parse(raw) as { itens?: unknown[] };
    const itens = Array.isArray(parsed.itens) ? parsed.itens : [];

    if (itens.length === 0) {
      redirect(`${base}?aviso=${encodeURIComponent("Lia não identificou itens acionáveis na entrada.")}`);
    }

    const encoded = Buffer.from(JSON.stringify(itens)).toString("base64url");
    redirectTo = `${base}?proposicoes=${encoded}&total=${itens.length}`;
  } catch (error) {
    console.error("[LiaDispatch] Falha ao processar entrada", error);
    redirect(`${base}?erro=${encodeURIComponent("Erro na análise da Lia. Tente novamente.")}`);
  }

  redirect(redirectTo);
}
