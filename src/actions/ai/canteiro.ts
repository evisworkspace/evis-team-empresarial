"use server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoEvento =
  | "execucao_servico"
  | "chegada_material"
  | "pedido_cliente"
  | "problema_obra"
  | "registro_financeiro"
  | "visita_obra"
  | "decisao_projeto"
  | "sem_atividade";

export type ItemCategorizado = {
  tipo: "visita" | "tarefa" | "atividade" | "proxima_demanda" | "registro_execucao" | "observacao" | "problema_obra";
  titulo: string;
  descricao: string;
  prioridade?: "urgente" | "alta" | "media" | "baixa";
  percentual?: number;
  dataSugerida?: string; // YYYY-MM-DD
  confianca: number; // 0.0 – 1.0
  motivoDeteccao: string;
};

// ─── Camada 0: Normalização ───────────────────────────────────────────────────

const TERMOS_REGIONAIS: Record<string, string> = {
  reboco: "revestimento argamassado",
  massa: "revestimento argamassado",
  contrapiso: "contrapiso",
  laje: "laje",
  fundação: "fundação",
  alicerce: "fundação",
  baldrame: "fundação",
  fiação: "instalação elétrica",
  encanamento: "instalação hidráulica",
  hidráulica: "instalação hidráulica",
  elétrica: "instalação elétrica",
  piso: "pavimentação",
  forro: "forro",
  azulejo: "revestimento cerâmico",
  cerâmica: "revestimento cerâmico",
  porcelanato: "revestimento em porcelanato",
};

function normalizarTexto(texto: string): string {
  let t = texto
    .replace(/\btá\b/gi, "está")
    .replace(/\btô\b/gi, "estou")
    .replace(/\bpro\b/gi, "para o")
    .replace(/\bpra\b/gi, "para a")
    .replace(/\bnum\b/gi, "não")
    .replace(/\bvô\b/gi, "vou")
    .replace(/\s+/g, " ")
    .trim();

  for (const [regional, oficial] of Object.entries(TERMOS_REGIONAIS)) {
    t = t.replace(new RegExp(`\\b${regional}\\b`, "gi"), oficial);
  }
  return t;
}

// ─── Camada 1: Detecção de Eventos ───────────────────────────────────────────

const PADROES_EVENTO: Array<{
  tipo: TipoEvento;
  padroes: RegExp[];
  certeza: "explicito" | "inferido";
}> = [
  {
    tipo: "execucao_servico",
    padroes: [
      /instalou|assentou|concluiu|finalizou|terminou|começou|iniciou|executou|colocou|fez|aplicou|montou/i,
      /está sendo|está pronto|está feito/i,
      /equipe.{0,40}(veio|trabalhou|fez|instalou)/i,
    ],
    certeza: "explicito",
  },
  {
    tipo: "chegada_material",
    padroes: [
      /chegou|entregou|recebeu|descarregou/i,
      /material|cimento|areia|tijolo|ferragem|vergalhão|tinta|argamassa/i,
    ],
    certeza: "explicito",
  },
  {
    tipo: "pedido_cliente",
    padroes: [
      /cliente (pediu|solicitou|quer|mandou|ligou|passou)/i,
      /dono (pediu|solicitou|quer|mandou)/i,
    ],
    certeza: "explicito",
  },
  {
    tipo: "problema_obra",
    padroes: [
      /faltou|falta|acabou|não tem|sem estoque/i,
      /problema|erro|falha|danificado|quebrou|vazamento/i,
      /atraso|atrasou|não veio/i,
    ],
    certeza: "explicito",
  },
  {
    tipo: "registro_financeiro",
    padroes: [
      /pagou|pagamento|nota fiscal|boleto|transferiu|pix/i,
      /R\$\s*[\d,.]+/,
    ],
    certeza: "explicito",
  },
  {
    tipo: "visita_obra",
    padroes: [
      /cliente (veio|passou|visitou|apareceu)/i,
      /engenheiro (veio|passou|visitou)/i,
      /visita|vistoria|inspeção/i,
    ],
    certeza: "explicito",
  },
  {
    tipo: "decisao_projeto",
    padroes: [
      /decidiu|definiu|aprovado|alterou|mudou o projeto|mudou o plano/i,
      /pediu para mudar|vai mudar/i,
    ],
    certeza: "explicito",
  },
  {
    tipo: "sem_atividade",
    padroes: [
      /dia tranquilo|sem atividade|nada aconteceu|choveu|paralisado|feriado/i,
    ],
    certeza: "explicito",
  },
];

type EventoDetectado = { tipo: TipoEvento; trecho: string; certeza: "explicito" | "inferido" };

function detectarEventos(texto: string): EventoDetectado[] {
  const eventos: EventoDetectado[] = [];
  const linhas = texto.split(/[.!?\n]+/).filter((l) => l.trim().length > 5);

  for (const linha of linhas) {
    for (const def of PADROES_EVENTO) {
      if (def.padroes.some((p) => p.test(linha))) {
        const jaExiste = eventos.some(
          (e) => e.tipo === def.tipo && e.trecho === linha.trim()
        );
        if (!jaExiste) {
          eventos.push({ tipo: def.tipo, trecho: linha.trim(), certeza: def.certeza });
        }
        break;
      }
    }
  }

  if (eventos.length === 0) {
    eventos.push({ tipo: "sem_atividade", trecho: texto.substring(0, 100), certeza: "inferido" });
  }
  return eventos;
}

// ─── Camada 2: Mapa evento → tipo HITL ───────────────────────────────────────

const MAPA_EVENTO_TIPO: Record<TipoEvento, ItemCategorizado["tipo"]> = {
  execucao_servico: "registro_execucao",
  chegada_material: "atividade",
  pedido_cliente: "proxima_demanda",
  problema_obra: "problema_obra",
  registro_financeiro: "observacao",
  visita_obra: "visita",
  decisao_projeto: "atividade",
  sem_atividade: "observacao",
};

const CONFIANCA_BASE: Record<"explicito" | "inferido", number> = {
  explicito: 0.88,
  inferido: 0.65,
};

// ─── Gemini: gera títulos legíveis para os itens HITL ─────────────────────────

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    itens: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          tipo: { type: SchemaType.STRING },
          titulo: { type: SchemaType.STRING },
          descricao: { type: SchemaType.STRING },
          prioridade: { type: SchemaType.STRING },
          percentual: { type: SchemaType.NUMBER },
          dataSugerida: { type: SchemaType.STRING },
          confianca: { type: SchemaType.NUMBER },
          motivoDeteccao: { type: SchemaType.STRING },
        },
        required: ["tipo", "titulo", "descricao", "confianca", "motivoDeteccao"],
      },
    },
  },
  required: ["itens"],
};

async function gerarItensGemini(
  textoNormalizado: string,
  eventosDetectados: EventoDetectado[],
  dataReferencia: string
): Promise<ItemCategorizado[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback: usar apenas detecção por padrão se não há API key
    return eventosDetectados
      .filter((e) => e.tipo !== "sem_atividade")
      .map((e) => ({
        tipo: MAPA_EVENTO_TIPO[e.tipo],
        titulo: e.trecho.substring(0, 80),
        descricao: e.trecho,
        confianca: CONFIANCA_BASE[e.certeza],
        motivoDeteccao: `Detecção automática: ${e.tipo}`,
      }));
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as any,
    },
  });

  const eventosDesc = eventosDetectados
    .map((e) => `- [${e.tipo}] (${e.certeza}) "${e.trecho}"`)
    .join("\n");

  const prompt = `Você é o Canteiro, assistente IA de gestão de obras de construção civil.

Data do registro: ${dataReferencia}

EVENTOS JÁ DETECTADOS AUTOMATICAMENTE:
${eventosDesc}

TEXTO DO DIÁRIO:
${textoNormalizado}

CATEGORIAS DISPONÍVEIS para o campo "tipo":
- visita: visita ao canteiro (cliente, engenheiro, visita técnica)
- tarefa: algo que precisa ser feito agora
- atividade: algo que já ocorreu hoje no canteiro
- proxima_demanda: próxima ação necessária, pode ter prazo
- registro_execucao: avanço percentual de um serviço (inclua percentual se citado)
- observacao: informação relevante sem ação imediata
- problema_obra: problema, falta, atraso ou ocorrência negativa

REGRAS:
- Consolide eventos similares em 1 item apenas
- Título deve ser curto e objetivo (máximo 80 caracteres, sem markdown)
- Descrição deve ser clara e humana (sem jargão técnico excessivo)
- Prioridade para problema_obra e proxima_demanda: urgente/alta/media/baixa
- percentual: número de 0 a 100 (somente se citado explicitamente)
- dataSugerida: formato YYYY-MM-DD (somente se citado ou inferível)
- confianca: de 0.0 a 1.0 — use os valores da detecção automática como base
- motivoDeteccao: breve explicação de por que este item foi identificado
- Se não há nada relevante, retorne itens array vazio

IMPORTANTE: Responda em PORTUGUÊS. Zero markdown nos textos.`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return (parsed.itens ?? []) as ItemCategorizado[];
  } catch {
    // Fallback para detecção por padrão
    return eventosDetectados
      .filter((e) => e.tipo !== "sem_atividade")
      .map((e) => ({
        tipo: MAPA_EVENTO_TIPO[e.tipo],
        titulo: e.trecho.substring(0, 80),
        descricao: e.trecho,
        confianca: CONFIANCA_BASE[e.certeza],
        motivoDeteccao: `Detecção automática: ${e.tipo}`,
      }));
  }
}

// ─── Ponto de entrada ─────────────────────────────────────────────────────────

export async function processarDiarioCanteiro(
  texto: string,
  dataReferencia: Date
): Promise<ItemCategorizado[]> {
  const textoNorm = normalizarTexto(texto);
  const eventos = detectarEventos(textoNorm);
  const dataStr = dataReferencia.toISOString().split("T")[0];
  return gerarItensGemini(textoNorm, eventos, dataStr);
}
