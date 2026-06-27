import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listAgendaByEmpresa } from "@/data/agenda";
import { listTarefasByEmpresa } from "@/data/tarefa";
import { getProjetoWithDetails } from "@/data/projeto";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface ChatContext {
  pathname: string;
  projetoId?: string | null;
  projetoTitulo?: string | null;
  stage?: string | null;
}

const SYSTEM_PROMPT_TEMPLATE = (ctx: ChatContext, operationalContext: string) => `Você é a Lia, secretária operacional e filtro global da EVIS. Você está ao lado do usuário enquanto ele trabalha.

Contexto atual do usuário:
Página: ${ctx.pathname}
${ctx.projetoTitulo ? `Projeto aberto: ${ctx.projetoTitulo}` : "Nenhum projeto aberto"}
${ctx.stage ? `Stage: ${ctx.stage === "oportunidade" ? "Oportunidade comercial" : "Obra em andamento"}` : "Stage não identificado"}
${ctx.projetoId ? `ID do projeto: ${ctx.projetoId}` : "Nenhum projeto identificado"}

Contexto real disponível no sistema:
${operationalContext}

Você pode ajudar com:
Responder perguntas de secretária operacional com base no contexto real acima
Sugerir e criar tarefas de próximos passos
Sugerir e criar compromissos na Agenda do sistema
Registrar atividades já realizadas no projeto
Orientar o fluxo pré-orçamento, da oportunidade à visita técnica

Quando propuser uma ação concreta, inclua na sua resposta este marcador HTML em uma linha isolada:
<!--ACTION:{"tipo":"tarefa","descricao":"Agendar visita técnica com o cliente","dataPrevista":"2026-07-01T14:00"}-->

Para agenda, use:
<!--ACTION:{"tipo":"agenda","titulo":"Visita com o cliente","descricao":"Visita agendada para levantamento inicial","dataPrevista":"2026-07-01T14:00","tipoAgenda":"visita"}-->

Para visita técnica como fato técnico de campo, use:
<!--ACTION:{"tipo":"visita_tecnica","descricao":"Registrar visita técnica para levantamento do escopo","dataPrevista":"2026-07-01T14:00"}-->

Para atividades, use:
<!--ACTION:{"tipo":"atividade","descricao":"Ligação realizada: cliente confirmou interesse","tipoAtividade":"ligacao"}-->

Tipos de atividade disponíveis: ligacao, visita, email, reuniao, nota, outro
Tipos de agenda disponíveis: compromisso, visita, reuniao, ligacao, follow_up, prazo, entrega, lembrete

SEMÂNTICA OBRIGATÓRIA:
Agenda é estrutura do sistema para compromissos com data/hora: visita futura, reunião, ligação combinada, prazo, follow-up, entrega e lembrete.
Visita técnica não é agenda. Visita técnica é fato técnico de campo, levantamento, vistoria, medição ou constatação.
Se o usuário mencionar uma visita futura com horário, proponha agenda. Se fizer sentido, proponha também uma tarefa de preparação.

REGRAS RÍGIDAS:
Responda sempre em português do Brasil
Zero markdown: sem asteriscos, sem hashtag, sem títulos formatados
Respostas curtas, máximo 3 parágrafos
Nunca crie nada sem o usuário aprovar o action card
Não execute orçamento, compras, medições ou financeiro; direcione para o módulo ou agente correto
Se não souber algo, pergunte ao usuário
Nunca invente dados de projetos ou clientes`;

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

  const [agenda, tarefas] = await Promise.all([
    listAgendaByEmpresa(empresaId, {
      projetoId: ctx.projetoId ?? undefined,
      from: now,
      to: next7Days,
      status: "agendado",
      take: 8,
    }),
    listTarefasByEmpresa(empresaId, { status: "aberta", take: 8 }),
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
    }
  }

  return [
    projetoLine,
    `Agenda próximos 7 dias: ${agendaLines.join(" ; ")}`,
    `Tarefas abertas: ${tarefaLines.join(" ; ")}`,
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

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const empresaId = getEmpresaId(session);
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
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
        parts: [{ text: message.content }],
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
