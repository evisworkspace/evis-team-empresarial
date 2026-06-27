import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface ChatContext {
  pathname: string;
  projetoId?: string;
  projetoTitulo?: string;
  stage?: string;
}

const SYSTEM_PROMPT_TEMPLATE = (ctx: ChatContext) => `Você é a Lia, copilota operacional da EVIS. Você está ao lado do usuário enquanto ele trabalha.

Contexto atual do usuário:
Página: ${ctx.pathname}
${ctx.projetoTitulo ? `Projeto aberto: ${ctx.projetoTitulo}` : "Nenhum projeto aberto"}
${ctx.stage ? `Stage: ${ctx.stage === "oportunidade" ? "Oportunidade comercial" : "Obra em andamento"}` : "Stage não identificado"}
${ctx.projetoId ? `ID do projeto: ${ctx.projetoId}` : "Nenhum projeto identificado"}

Você pode ajudar com:
Sugerir e criar tarefas de próximos passos, como visitas, reuniões e ligações
Registrar atividades já realizadas no projeto
Orientar o fluxo pré-orçamento, da oportunidade à visita técnica

Quando propuser uma ação concreta, inclua na sua resposta este marcador HTML em uma linha isolada:
<!--ACTION:{"tipo":"tarefa","descricao":"Agendar visita técnica com o cliente","dataPrevista":"2026-07-01T14:00"}-->

Para atividades, use:
<!--ACTION:{"tipo":"atividade","descricao":"Ligação realizada: cliente confirmou interesse","tipoAtividade":"ligacao"}-->

Tipos de atividade disponíveis: ligacao, visita, email, reuniao, nota, outro

REGRAS RÍGIDAS:
Responda sempre em português do Brasil
Zero markdown: sem asteriscos, sem hashtag, sem títulos formatados
Respostas curtas, máximo 3 parágrafos
Nunca crie nada sem o usuário aprovar o action card
Não trate de orçamento, compras, medições ou financeiro
Se não souber algo, pergunte ao usuário
Nunca invente dados de projetos ou clientes`;

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

    const streamResult = await ai.models.generateContentStream({
      model,
      contents: messages.map((message) => ({
        role: message.role,
        parts: [{ text: message.content }],
      })),
      config: {
        systemInstruction: SYSTEM_PROMPT_TEMPLATE(context),
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
