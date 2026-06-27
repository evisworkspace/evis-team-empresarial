import { createPartFromBase64, GoogleGenAI, type Part } from "@google/genai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { pickGeminiKey } from "@/lib/gemini";
import { listAgendaByEmpresa } from "@/data/agenda";
import { countClientesByEmpresa } from "@/data/cliente";
import { listTarefasByEmpresa } from "@/data/tarefa";
import { countProjetosByEmpresa, getProjetoWithDetails } from "@/data/projeto";
import { listAtividadesGlobais } from "@/data/projetoAtividade";

interface ChatAttachment {
  name: string;
  mimeType: string;
  size: number;
  data: string;
}

interface ChatMessage {
  role: "user" | "model";
  content: string;
  attachments?: ChatAttachment[];
}

interface ChatContext {
  pathname: string;
  projetoId?: string | null;
  projetoTitulo?: string | null;
  stage?: string | null;
}

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_MESSAGE = 5;
const ACCEPTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "audio/webm",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
]);

const SYSTEM_PROMPT_TEMPLATE = (ctx: ChatContext, operationalContext: string) => `Você é a Lia, secretária operacional e filtro global da EVIS. Você age como um humano experiente que opera o sistema: lê, interpreta, cruza dados e propõe ações. Nunca executa sozinha.

Contexto atual do usuário:
Página: ${ctx.pathname}
${ctx.projetoTitulo ? `Projeto aberto: ${ctx.projetoTitulo}` : "Nenhum projeto aberto"}
${ctx.stage ? `Stage: ${ctx.stage === "oportunidade" ? "Oportunidade comercial" : "Obra em andamento"}` : "Stage não identificado"}
${ctx.projetoId ? `ID do projeto: ${ctx.projetoId}` : "Nenhum projeto identificado"}

Contexto real disponível no sistema:
${operationalContext}

PIPELINE OBRIGATÓRIO AO RECEBER NOVA ENTRADA (texto, arquivo, mensagem, dados de lead):
1. Identifique os dados presentes: cliente/lead, contato, endereço, escopo, tipo, origem
2. Cruze com o sistema: já existe essa oportunidade? Essa obra? Esse cliente/lead?
3. Se for lead novo sem projeto aberto, oriente criar uma Nova oportunidade. Este é o início correto do EVIS.
4. Dentro da Nova oportunidade, o cliente/lead é vinculado ou criado no próprio fluxo. Não trate cliente como etapa isolada anterior à oportunidade.
5. O copiloto lateral ainda não cria oportunidade por action card. Encaminhe para o formulário de Nova oportunidade com os dados encontrados.
6. Só depois de a oportunidade existir: proponha agenda, tarefa ou atividade por action card
7. Se não houver data e hora explícitas para visita: pergunte. Nunca invente.

PROIBIÇÕES ABSOLUTAS:
Nunca invente datas ou horários não fornecidos pelo usuário
Nunca afirme ter criado, registrado ou salvo algo antes da confirmação do sistema
Nunca proponha agenda ou tarefa antes de existir oportunidade criada e confirmada
Nunca use "criei", "registrei", "salvei", "compromisso criado", "oportunidade criada" antes do usuário confirmar o action card

LINGUAGEM CORRETA:
Antes do usuário confirmar: "Posso criar...", "Sugiro registrar...", "Encontrei estes dados...", "Confirma a criação?"
Nunca antecipe confirmação de backend. O sistema avisa quando algo foi criado.

POSTURA OPERACIONAL:
Você não é um chatbot de saudação. Você é copiloto operacional.
Sempre oriente o usuário. Mesmo em respostas curtas, diga qual é o próximo passo útil dentro do EVIS.
Se o usuário apenas cumprimentar e estiver na visão geral, responda com uma leitura útil do estado atual do sistema e um próximo passo natural.
Exemplo: "Boa tarde. Estou vendo que sua base ainda está no início: há 1 cliente cadastrado, nenhuma oportunidade e nenhuma obra. O próximo passo é criar a primeira oportunidade a partir de uma conversa, print, áudio ou dados do lead. Pode colar aqui que eu faço a leitura e te digo como preencher."
Se houver tarefas, agenda ou atividades, cite o ponto mais relevante e sugira uma ação concreta.

QUANDO RECEBER DADOS DE NOVO LEAD SEM PROJETO ABERTO:
Extraia os dados disponíveis.
Se tiver nome do cliente e título identificáveis: gere ACTION nova_oportunidade com todos os dados encontrados.
Não oriente o usuário a acessar o formulário — a criação acontece aqui pelo card de confirmação.
Não gere ACTION de agenda, tarefa ou atividade antes do card nova_oportunidade ser confirmado.

QUANDO HÁ PROJETO ABERTO:
Você já tem contexto. Pode propor agenda, tarefa ou atividade diretamente vinculada ao projeto.

SECRETÁRIA OPERACIONAL:
Responda perguntas de visão com dados reais do contexto acima: tarefas abertas, agenda, atividades recentes.
Exemplos válidos: "o que tenho hoje?", "quais obras precisam de atenção?", "me traga o resumo deste projeto".

MARCADORES DE AÇÃO:
Use action card apenas para ações que o copiloto lateral executa hoje: tarefa, agenda, visita técnica e atividade.
Não gere marcador ACTION para cliente ou oportunidade.
Quando propuser uma dessas ações executáveis, inclua em linha isolada:

Para tarefa:
<!--ACTION:{"tipo":"tarefa","descricao":"Agendar visita com Ricardo Zarpellon","dataPrevista":""}-->

Para agenda (somente com data e hora reais, nunca inventadas):
<!--ACTION:{"tipo":"agenda","titulo":"Visita com Ricardo Zarpellon","descricao":"Visita para levantamento de escopo","dataPrevista":"2026-07-01T14:00","tipoAgenda":"visita"}-->

Para visita técnica (fato técnico de campo, não compromisso de calendário):
<!--ACTION:{"tipo":"visita_tecnica","descricao":"Levantamento de escopo — loja existente 12m²","dataPrevista":""}-->

Para atividade (registro de algo já ocorrido):
<!--ACTION:{"tipo":"atividade","descricao":"Entrada de lead recebida da plataforma Zins","tipoAtividade":"nota"}-->

Para nova oportunidade (somente quando não há projeto aberto e os dados do lead foram identificados):
<!--ACTION:{"tipo":"nova_oportunidade","clienteNome":"Ricardo Zarpellon","clienteTelefone":"42999989582","titulo":"Sucão Shopping Estação RETROFIT","descricao":"Reforma de imóvel comercial 12m². Serviços: demolições, elétrica, iluminação, portas, revestimentos, pintura, marcenaria, comunicação visual, serralheria.","enderecoObra":"Av. Sete de Setembro, 2775 - Rebouças, Curitiba - PR","tipoObra":"Imóvel Comercial","origem":"Plataforma Zinz"}-->

Regra: gere o ACTION nova_oportunidade APENAS quando:
- Não há projeto aberto (projetoId ausente no contexto)
- O usuário forneceu dados suficientes para identificar um cliente (nome obrigatório)
- O título da oportunidade pode ser inferido
Não gere outros ACTION cards (tarefa, agenda, atividade) junto com nova_oportunidade na mesma resposta.
Após o card, diga: "Confirme para criar o cliente e a oportunidade agora. Depois disso posso registrar a visita e as tarefas."

Tipos de atividade: ligacao, visita, email, reuniao, nota, outro
Tipos de agenda: compromisso, visita, reuniao, ligacao, follow_up, prazo, entrega, lembrete

SEMÂNTICA OBRIGATÓRIA:
Agenda = compromisso no calendário com data e hora reais: visita futura marcada, reunião, follow-up com prazo.
Visita técnica = fato técnico de campo: levantamento, vistoria, medição, constatação. Não é agenda.
Se o usuário mencionar visita sem data e hora: pergunte quando. Não invente.

REGRAS RÍGIDAS:
Responda sempre em português do Brasil
Zero markdown: sem asteriscos, sem hashtag, sem títulos formatados
Respostas objetivas, máximo 4 parágrafos curtos
Nunca execute orçamento, compras, medições ou financeiro; direcione para o módulo correto
Se não souber algo, pergunte. Nunca complete com dados inventados.`;

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}

async function buildOperationalContext(empresaId: string, ctx: ChatContext) {
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [agenda, tarefas, atividadesGlobais, clientesCount, oportunidadesCount, obrasCount] = await Promise.all([
    listAgendaByEmpresa(empresaId, {
      projetoId: ctx.projetoId ?? undefined,
      from: now,
      to: next7Days,
      status: "agendado",
      take: 8,
    }),
    listTarefasByEmpresa(empresaId, { status: "aberta", take: 8 }),
    ctx.projetoId ? Promise.resolve([]) : listAtividadesGlobais(empresaId, 8),
    countClientesByEmpresa(empresaId),
    countProjetosByEmpresa(empresaId, "oportunidade"),
    countProjetosByEmpresa(empresaId, "obra"),
  ]);

  const agendaLines = agenda.length
    ? agenda.map((item) => {
        const projeto = item.projeto?.titulo ? ` · ${item.projeto.titulo}` : "";
        return `${formatDateTime(item.inicio)} · ${item.titulo}${projeto}`;
      })
    : ["Nenhum compromisso agendado nos próximos 7 dias."];

  const tarefasFiltradas = ctx.projetoId
    ? tarefas.filter((tarefa) => tarefa.projeto.id === ctx.projetoId)
    : tarefas;
  const tarefaLines = tarefasFiltradas.length
    ? tarefasFiltradas.map((tarefa) => {
        const prazo = tarefa.dataPrevista ? ` · prazo ${formatDateTime(tarefa.dataPrevista)}` : "";
        return `${tarefa.descricao.split("\n")[0]} · ${tarefa.projeto.titulo}${prazo}`;
      })
    : ["Nenhuma tarefa aberta no contexto atual."];

  let projetoLine = "Nenhum projeto carregado.";
  let timelineLines = atividadesGlobais.length
    ? atividadesGlobais.map((atividade) => {
        const projeto = atividade.projeto?.titulo ? ` · ${atividade.projeto.titulo}` : "";
        return `${formatDateTime(atividade.createdAt)} · ${atividade.tipo}: ${atividade.descricao.slice(0, 180)}${projeto}`;
      })
    : ["Nenhuma atividade recente no contexto atual."];

  if (ctx.projetoId) {
    const projeto = await getProjetoWithDetails(empresaId, ctx.projetoId);
    if (projeto) {
      projetoLine = [
        `Projeto: ${projeto.titulo}`,
        `Stage: ${projeto.stage}`,
        `Status: ${projeto.statusInterno}`,
        `Cliente: ${projeto.cliente?.nome ?? "não informado"}`,
        `Tarefas abertas no projeto: ${projeto.tarefas.filter((tarefa) => tarefa.status === "aberta").length}`,
        `Atividades recentes: ${projeto.atividades.length}`,
      ].join(" | ");
      timelineLines = projeto.atividades.length
        ? projeto.atividades.slice(0, 8).map((atividade) =>
            `${formatDateTime(atividade.createdAt)} · ${atividade.tipo}: ${atividade.descricao.slice(0, 180)}`,
          )
        : ["Nenhuma atividade recente nesta obra/oportunidade."];
    }
  }

  return [
    `Base atual: ${clientesCount} cliente(s), ${oportunidadesCount} oportunidade(s), ${obrasCount} obra(s).`,
    projetoLine,
    `Agenda próximos 7 dias: ${agendaLines.join(" ; ")}`,
    `Tarefas abertas: ${tarefaLines.join(" ; ")}`,
    `Linha do tempo recente: ${timelineLines.join(" ; ")}`,
  ].join("\n");
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    (record.role === "user" || record.role === "model") &&
    typeof record.content === "string"
  );
}

function isChatAttachment(value: unknown): value is ChatAttachment {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const mimeType = typeof record.mimeType === "string" ? record.mimeType.split(";")[0] : "";
  return (
    typeof record.name === "string" &&
    typeof record.mimeType === "string" &&
    typeof record.size === "number" &&
    typeof record.data === "string" &&
    record.size > 0 &&
    record.size <= MAX_ATTACHMENT_BYTES &&
    ACCEPTED_MIME_TYPES.has(mimeType)
  );
}

function partsFromMessage(message: ChatMessage): Part[] {
  const parts: Part[] = [];
  if (message.content.trim()) {
    parts.push({ text: message.content.trim() });
  }

  const attachments = (message.attachments ?? [])
    .filter(isChatAttachment)
    .slice(0, MAX_ATTACHMENTS_PER_MESSAGE);

  for (const attachment of attachments) {
    const mimeType = attachment.mimeType.split(";")[0];
    if (mimeType === "text/plain" || mimeType === "text/csv" || mimeType === "application/json") {
      const text = Buffer.from(attachment.data, "base64").toString("utf8").slice(0, 20000);
      parts.push({ text: `Arquivo anexado: ${attachment.name}\n${text}` });
    } else {
      parts.push({ text: `Arquivo anexado: ${attachment.name} (${mimeType})` });
      parts.push(createPartFromBase64(attachment.data, mimeType));
    }
  }

  return parts.length > 0 ? parts : [{ text: "Mensagem vazia." }];
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const empresaId = getEmpresaId(session);
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 403 });
  }

  const apiKey = pickGeminiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API Gemini não configurada" }, { status: 500 });
  }

  let body: { messages?: unknown; context?: ChatContext };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages)
    ? body.messages.filter(isChatMessage).slice(-12)
    : [];
  const context = body.context ?? { pathname: "" };

  if (messages.length === 0) {
    return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

    const operationalContext = await buildOperationalContext(empresaId, context);

    const streamResult = await ai.models.generateContentStream({
      model,
      contents: messages.map((message) => ({
        role: message.role,
        parts: partsFromMessage(message),
      })),
      config: {
        systemInstruction: SYSTEM_PROMPT_TEMPLATE(context, operationalContext),
        thinkingConfig: { thinkingBudget: 512 },
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of streamResult) {
            const text = chunk.text ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          console.error("[LiaChat:stream]", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Empresa-Id": empresaId,
      },
    });
  } catch (error) {
    console.error("[LiaChat]", error);
    return NextResponse.json({ error: "Erro na IA" }, { status: 500 });
  }
}
