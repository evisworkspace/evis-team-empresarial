"use server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ContextoObra = {
  nomeObra: string;
  stage: "oportunidade" | "obra";
  tipoObra?: string | null;
  itensOrcamento?: Array<{ nome: string; categoria?: string | null }>;
};

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
  emboço: "revestimento argamassado",
  contrapiso: "contrapiso",
  laje: "laje",
  fundação: "fundação",
  alicerce: "fundação",
  baldrame: "fundação",
  fiação: "instalação elétrica",
  encanamento: "instalação hidráulica",
  hidráulica: "instalação hidráulica",
  elétrica: "instalação elétrica",
  marmoraria: "revestimento em pedra",
  piso: "pavimentação",
  forro: "forro",
  gesso: "gesso",
  drywall: "parede seca",
  azulejo: "revestimento cerâmico",
  cerâmica: "revestimento cerâmico",
  porcelanato: "revestimento em porcelanato",
};

function normalizarTexto(texto: string): string {
  let t = texto
    .replace(/\bé\s+é\b/gi, "é")
    .replace(/\bum\s+um\b/gi, "um")
    .replace(/\btá\b/gi, "está")
    .replace(/\btô\b/gi, "estou")
    .replace(/\bpro\b/gi, "para o")
    .replace(/\bpra\b/gi, "para a")
    .replace(/\bnum\b/gi, "não")
    .replace(/\bnuma\b/gi, "em uma")
    .replace(/\bvô\b/gi, "vou")
    .replace(/\bsô\b/gi, "senhor")
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
      /está (sendo|pronto|feito|concluído)/i,
      /equipe.{0,40}(veio|trabalhou|fez|instalou)/i,
      /pessoal.{0,40}(veio|trabalhou|fez|instalou)/i,
    ],
    certeza: "explicito",
  },
  {
    tipo: "execucao_servico",
    padroes: [
      /pessoal da|equipe de|equipe da|time de/i,
    ],
    certeza: "inferido",
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
  dataReferencia: string,
  contextoObra?: ContextoObra
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

  const contextoObraStr = contextoObra
    ? `CONTEXTO DA OBRA/PROJETO:
Nome: ${contextoObra.nomeObra}
Tipo: ${contextoObra.stage === "obra" ? "Obra em execução" : "Oportunidade / pré-obra"}
${contextoObra.tipoObra ? `Categoria: ${contextoObra.tipoObra}` : ""}
${contextoObra.itensOrcamento && contextoObra.itensOrcamento.length > 0
  ? `Itens do orçamento registrados (use para vincular serviços mencionados):\n${contextoObra.itensOrcamento.slice(0, 20).map(i => `- ${i.nome}${i.categoria ? ` (${i.categoria})` : ""}`).join("\n")}`
  : "Orçamento ainda não cadastrado."
}`
    : "";

  const prompt = `Você é o Canteiro, assistente especializado em gestão de projetos de construção civil e reformas comerciais no Brasil.

Sua função: extrair todos os itens práticos e operacionais de um relato bruto (texto de voz ou escrito) e transformá-los em cartões estruturados para validação humana.

Data do registro: ${dataReferencia}
${contextoObraStr ? `\n${contextoObraStr}\n` : ""}
SINAIS JÁ DETECTADOS AUTOMATICAMENTE (use como ponto de partida):
${eventosDesc}

RELATO BRUTO:
${textoNormalizado}

CATEGORIAS disponíveis para o campo "tipo":
- visita: visita técnica, levantamento, vistoria, reunião presencial realizada
- atividade: ação já executada hoje (reunião, ligação, levantamento, inspeção)
- tarefa: ação que precisa ser executada (ainda não foi feita)
- proxima_demanda: próxima etapa necessária, pode ter prazo ou responsável
- registro_execucao: serviço de obra executado, pode ter percentual de avanço
- observacao: informação técnica relevante, constatação, condição identificada
- problema_obra: problema, risco, pendência técnica, não conformidade, item irregular

COMO EXTRAIR — LEIA COM ATENÇÃO:

1. Gere UM item do tipo "visita" ou "atividade" descrevendo o contexto geral do relato, mesmo que não seja mencionado explicitamente. Se foi uma visita técnica, o contexto geral deve virar um cartão de registro.

2. Para cada ação que PRECISA ser feita: gere um item "tarefa" ou "proxima_demanda". Exemplos: "falar com Fulano", "enviar mensagem", "solicitar projeto", "confirmar escopo", "levantar orçamento", "enviar devolutiva".

3. Para cada problema, risco ou ponto de atenção técnica: gere "problema_obra". Inclua o que foi observado, mesmo que não seja um problema confirmado — pode ser suspeita, item a verificar, situação irregular.

4. Para cada informação técnica constatada: gere "observacao". Exemplos: "sistema de incêndio aparentemente desativado", "forro de PVC na retaguarda", "piso necessita avaliação".

5. Quando houver PESSOAS mencionadas no relato com papéis específicos: inclua o nome e papel no título ou descrição da tarefa/atividade. Exemplo: "Solicitar escopo real da reforma à Pamela (responsável pelos projetos)".

6. Quando houver ESCOPO não definido ou projetos faltando: gere uma "proxima_demanda" para confirmar/solicitar.

REGRAS DE QUALIDADE:
- Extraia itens DISTINTOS — não duplique o mesmo fato com tipos diferentes
- Prefira extrair mais itens do que perder informação, mas nunca repita o mesmo evento em dois cartões
- Título deve ser autoexplicativo sem precisar ler a descrição (máximo 120 caracteres, sem markdown)
- Descrição deve ter conteúdo completo e útil — nunca truncar, nunca repetir só o título
- Prioridade obrigatória para "problema_obra" e "proxima_demanda": urgente/alta/media/baixa
- percentual: número de 0 a 100 (somente se citado explicitamente no texto)
- dataSugerida: YYYY-MM-DD (somente se citado ou claramente inferível)
- confianca: de 0.0 a 1.0 — use 0.85-0.95 quando explícito, 0.65-0.80 quando inferido
- motivoDeteccao: frase objetiva explicando de onde veio este item no relato
- Se não há nada relevante no relato, retorne array vazio

EXEMPLO DE QUALIDADE — para um relato de visita técnica, espera-se extrair:
* 1 atividade com contexto geral da visita
* 1-3 tarefas de acompanhamento (falar com X, confirmar Y, enviar Z)
* 1-5 observações técnicas constatadas
* 1-3 problemas/riscos identificados
* 1-2 proximas_demandas de definição de escopo

RESPONDA EM PORTUGUÊS. Zero markdown nos textos.`;

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
  dataReferencia: Date,
  contextoObra?: ContextoObra
): Promise<ItemCategorizado[]> {
  const textoNorm = normalizarTexto(texto);
  const eventos = detectarEventos(textoNorm);
  const dataStr = dataReferencia.toISOString().split("T")[0];
  return gerarItensGemini(textoNorm, eventos, dataStr, contextoObra);
}
