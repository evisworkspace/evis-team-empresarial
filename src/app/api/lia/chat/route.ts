import { createPartFromBase64, GoogleGenAI, type Part } from "@google/genai";
import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { withGeminiKeyRotation } from "@/lib/gemini";
import { withGroqKeyRotation } from "@/lib/groq";
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
const DEV = process.env.NODE_ENV !== "production";
const GROQ_FALLBACK_MODEL = "llama-3.3-70b-versatile";
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

type LiaErrorCategory = "quota" | "auth" | "provider" | "payload" | "unknown";

interface LiaErrorInfo {
  category: LiaErrorCategory;
  code?: number;
  status?: string;
  message: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function parseNestedGoogleError(message: string): { code?: number; status?: string; message?: string } {
  try {
    const parsed = JSON.parse(message) as unknown;
    const root = asRecord(parsed);
    const nested = asRecord(root?.error);
    return {
      code: typeof nested?.code === "number" ? nested.code : undefined,
      status: typeof nested?.status === "string" ? nested.status : undefined,
      message: typeof nested?.message === "string" ? nested.message : undefined,
    };
  } catch {
    return {};
  }
}

function classifyLiaError(error: unknown): LiaErrorInfo {
  const rawMessage = readErrorMessage(error);
  const parsed = parseNestedGoogleError(rawMessage);
  const message = parsed.message ?? rawMessage;
  const status = parsed.status ?? (rawMessage.match(/\b[A-Z_]{4,}\b/)?.[0]);
  const code = parsed.code ?? (rawMessage.includes("429") ? 429 : undefined);
  const normalized = `${status ?? ""} ${message}`.toLowerCase();

  if (code === 429 || normalized.includes("resource_exhausted") || normalized.includes("rate_limit_exceeded") || normalized.includes("quota")) {
    return { category: "quota", code: code ?? 429, status: status ?? "RESOURCE_EXHAUSTED", message };
  }
  if (code === 401 || code === 403 || normalized.includes("permission_denied") || normalized.includes("unauthenticated")) {
    return { category: "auth", code, status, message };
  }
  if (normalized.includes("invalid json") || normalized.includes("payload")) {
    return { category: "payload", code, status, message };
  }
  if (status || code) return { category: "provider", code, status, message };
  return { category: "unknown", code, status, message };
}

function logLiaError(scope: string, error: unknown, meta: Record<string, unknown>) {
  const info = classifyLiaError(error);
  console.error(scope, {
    ...meta,
    category: info.category,
    code: info.code,
    status: info.status,
    message: info.message,
    stack: DEV && error instanceof Error ? error.stack : undefined,
  });
}

function userMessageForLiaError(error: unknown, meta: { route: string; model: string; context: ChatContext }) {
  const info = classifyLiaError(error);
  const base = info.category === "quota"
    ? "Não consegui processar porque a IA retornou limite de uso ou cota esgotada. Erro registrado para análise."
    : info.category === "auth"
      ? "Não consegui processar porque a autenticação da IA falhou. Erro registrado para análise."
      : "Não consegui processar essa solicitação agora. Erro registrado para análise.";

  if (!DEV) return base;

  return [
    base,
    "",
    `DEV: ${meta.route} falhou no provider.`,
    `Modelo: ${meta.model}`,
    `Categoria: ${info.category}`,
    `Status: ${info.status ?? "n/a"}`,
    `Código: ${info.code ?? "n/a"}`,
    `Contexto: ${meta.context.projetoId ? `projeto=${meta.context.projetoId}` : "global"}`,
    `Erro: ${info.message.slice(0, 600)}`,
  ].join("\n");
}

function getSystemDateBR(now: Date): string {
  const tz = "America/Sao_Paulo";
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} (${get("weekday")})`;
}

function getSystemDateContext(now: Date): string {
  const tz = "America/Sao_Paulo";
  const fmt = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: tz, day: "2-digit", month: "2-digit", year: "numeric", weekday: "long" }).format(date);
  const yesterday = new Date(now.getTime() - 86400000);
  const nextMonday = new Date(now);
  const dayOfWeek = now.getDay(); // 0=sun
  nextMonday.setDate(now.getDate() + (dayOfWeek === 0 ? 1 : 8 - dayOfWeek));
  return [
    `- "hoje" = ${fmt(now)}`,
    `- "ontem" = ${fmt(yesterday)}`,
    `- "próxima semana" = começa ${fmt(nextMonday)}`,
    `Regra geral: "dia X passado" = o dia X mais recente já decorrido. Se ambíguo, peça confirmação antes de criar qualquer registro com data.`,
  ].join("\n");
}

const SYSTEM_PROMPT_TEMPLATE = (ctx: ChatContext, operationalContext: string, now: Date) => `Você é a Lia, secretária operacional e filtro global da EVIS. Você age como um humano experiente que opera o sistema: lê, interpreta, cruza dados e propõe ações. Nunca executa sozinha.

Data atual do sistema: ${getSystemDateBR(now)}. Interprete expressões relativas sempre a partir dessa data:
${getSystemDateContext(now)}

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
5. Só depois de a oportunidade existir: proponha agenda, tarefa ou atividade por action card
6. Se não houver data e hora explícitas para visita: pergunte. Nunca invente.

LEITURA DE VISITA (ativa somente quando projetoId está no contexto):
Se o usuário descrever uma visita técnica, levantamento, vistoria ou acompanhamento de obra:
1. Confirme o entendimento em 1-2 frases naturais
2. Emita UM action card com tipo "leitura_visita" contendo o pacote semântico completo
3. Separe sempre fatos confirmados de premissas e pendências
4. Nunca invente data, horário, participante ou valor — use vazio se não informado
5. Se projetoId não estiver no contexto: informe que a leitura de visita exige abrir o projeto primeiro
6. Não repita no texto o que já está no action card
7. Para leitura_visita, data e horário podem ficar vazios; a regra de perguntar data/hora vale para agenda futura, não para leitura semântica de visita já relatada

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
Se o usuário apenas cumprimentar (oi, olá, boa tarde, tudo bem, como vai), responda SOMENTE com saudação curta e aguarde o pedido. NÃO leia o banco nem o contexto operacional em resposta a cumprimento. Exemplo correto: "Boa tarde. Como posso ajudar?"
Leia o banco e o contexto operacional SOMENTE quando o usuário pedir explicitamente: agenda do dia, tarefas, resumo de obra, pendências, obras com atenção, etc.

QUANDO RECEBER DADOS DE NOVO LEAD SEM PROJETO ABERTO:
Extraia os dados disponíveis.
Se tiver nome do cliente identificável: gere ACTION nova_oportunidade imediatamente com os dados disponíveis. O nome do cliente é o único campo obrigatório. O título pode ser inferido como "Oportunidade — [Nome do cliente]". Todos os demais campos são opcionais — preencha o que estiver disponível, deixe em branco o resto. NUNCA peça mais dados antes de gerar o card.
Não oriente o usuário a acessar o formulário — a criação acontece aqui pelo card de confirmação.
Não gere ACTION de agenda, tarefa ou atividade antes do card nova_oportunidade ser confirmado.

AVALIAÇÃO AUTOMÁTICA DE CONTEXTO (quando receber "Contexto carregado. Avalie o estado atual e sugira a próxima ação."):
Esta é uma abertura automática do copiloto. NÃO cumprimente. NÃO pergunte "quer que eu sugira?". Responda diretamente em 2 partes:
1. Estado atual: uma frase com stage, status e pendências relevantes.
2. Próxima ação concreta — JÁ INCLUA o ACTION card correspondente:
   oportunidade + novo → gere ACTION de tarefa "Agendar visita técnica ou reunião com o cliente" (se não houver data disponível, use tarefa em vez de agenda)
   oportunidade + em_negociacao → gere ACTION de tarefa "Acompanhar andamento do orçamento"
   oportunidade + proposta_enviada → gere ACTION de tarefa "Follow-up com o cliente em 5 dias"
   obra + em_andamento com tarefas em atraso → gere ACTION de atividade descrevendo o alerta
   obra + em_andamento sem atividade recente → gere ACTION de atividade "Registrar andamento do dia no Diário"
   obra + concluida → não gere ACTION, informe que o encerramento deve ser feito no módulo correto
O ACTION card é o "Confirmar" para o usuário. Não exija que ele responda antes de ver a opção.

QUANDO HÁ PROJETO ABERTO:
Você já tem contexto. Pode propor agenda, tarefa ou atividade diretamente vinculada ao projeto.

QUANDO O USUÁRIO PEDIR SUGESTÕES DE TAREFAS PARA UMA OPORTUNIDADE ABERTA:
Não use a narrativa de cadastro como plano operacional automático.
Apresente opções de próximo caminho com HITL, seguindo a semântica de oportunidades:
- agendar visita presencial ou reunião inicial com o cliente
- iniciar pré-orçamento pelos arquivos recebidos
- solicitar informações complementares
- aguardar definição
- enviar mensagem de alinhamento ao cliente
Gere no máximo 3 ACTION cards de tarefa por resposta.
As tarefas são sugestões, nunca obrigatórias. Explique em uma frase que o usuário pode aceitar, editar ou ignorar.

SECRETÁRIA OPERACIONAL:
Responda perguntas de visão com dados reais do contexto acima: tarefas abertas, agenda, atividades recentes.
Exemplos válidos: "o que tenho hoje?", "quais obras precisam de atenção?", "me traga o resumo deste projeto".

MARCADORES DE AÇÃO:
Use action card para: tarefa, agenda, visita_tecnica, atividade e nova_oportunidade.
Não gere ACTION para cliente isolado sem oportunidade vinculada.
Quando propuser uma dessas ações executáveis, inclua em linha isolada:

Para tarefa:
<!--ACTION:{"tipo":"tarefa","descricao":"Agendar visita com Ricardo Zarpellon","dataPrevista":""}-->

Para agenda (somente com data e hora reais, nunca inventadas):
<!--ACTION:{"tipo":"agenda","titulo":"Visita com Ricardo Zarpellon","descricao":"Visita para levantamento de escopo","dataPrevista":"2026-07-01T14:00","tipoAgenda":"visita"}-->

Para visita técnica (fato técnico de campo já realizado, registro na linha do tempo, não compromisso de calendário e não tarefa pendente):
<!--ACTION:{"tipo":"visita_tecnica","descricao":"Levantamento de escopo — loja existente 12m²","dataPrevista":""}-->

Para atividade (registro de algo já ocorrido):
<!--ACTION:{"tipo":"atividade","descricao":"Entrada de lead recebida da plataforma Zins","tipoAtividade":"nota"}-->

Para nova oportunidade (somente quando não há projeto aberto e os dados do lead foram identificados):
<!--ACTION:{"tipo":"nova_oportunidade","clienteNome":"Ricardo Zarpellon","clienteTelefone":"42999989582","clienteTipoPessoa":"PJ","clienteEmail":"contato@empresa.com","clienteCpfCnpj":"00.000.000/0001-00","clienteRazaoSocial":"Empresa Ltda","clienteCep":"80240-000","clienteRua":"Av. Sete de Setembro","clienteNumero":"2775","clienteBairro":"Rebouças","clienteCidade":"Curitiba","clienteEstado":"PR","titulo":"Sucão Shopping Estação RETROFIT","descricao":"Reforma de imóvel comercial 12m². Serviços: demolições, elétrica, iluminação, portas, revestimentos, pintura, marcenaria, comunicação visual, serralheria.","cepObra":"80240-000","logradouroObra":"Av. Sete de Setembro","numeroEnderecoObra":"2775","bairroObra":"Rebouças","cidadeObra":"Curitiba","estadoObra":"PR","tipoObra":"comercial","origem":"outros"}-->

Para leitura de visita (somente quando há projeto aberto):
<!--ACTION:{"tipo":"leitura_visita","titulo":"Visita técnica — Badida ParkShoppingBarigui","descricao":"Resumo operacional da visita técnica em 1-2 frases.","visitaData":"","visitaHorario":"","visitaParticipantes":"Evandro, Valdecir","visitaLocal":"Cozinha","visitaFatos":"levantamento fotográfico realizado|escopo de reforma identificado","visitaPremissas":"impermeabilização provavelmente necessária","visitaPendencias":"confirmar caderno técnico do shopping","visitaEscopo":"civil|elétrica|hidráulica|gás|exaustão","visitaRiscos":"","visitaTarefas":"confirmar caderno técnico do shopping|montar escopo preliminar da reforma","visitaAnotacaoRascunho":"Rascunho da leitura da visita técnica...","visitaDiarioRascunho":"Visita técnica registrada: levantamento e escopo preliminar identificados."}-->

Regra: gere o ACTION nova_oportunidade APENAS quando:
- Não há projeto aberto (projetoId ausente no contexto)
- O usuário forneceu dados suficientes para identificar um cliente (nome obrigatório)
- O título da oportunidade pode ser inferido
Não gere outros ACTION cards (tarefa, agenda, atividade) junto com nova_oportunidade na mesma resposta.
Após o card, diga: "Confirme para criar o cliente e a oportunidade agora. Depois disso posso registrar a visita e as tarefas."
Se houver CNPJ, razão social, e-mail, endereço, dados bancários, inscrição estadual/municipal ou redes sociais do cliente, preserve nos campos cliente* quando houver campo, e em clienteObservacoes quando não houver campo estruturado.
Se o endereço do cliente e o endereço da oportunidade parecerem o mesmo, preencha ambos os grupos: clienteCep/clienteRua/... e cepObra/logradouroObra/...

Tipos de atividade: ligacao, visita, email, reuniao, nota, outro
Tipos de agenda: compromisso, visita, reuniao, ligacao, follow_up, prazo, entrega, lembrete

SEMÂNTICA OBRIGATÓRIA:
Agenda = compromisso FUTURO no calendário com data e hora reais: visita futura marcada, reunião, follow-up com prazo.
Tarefa = pendência FUTURA: algo que ainda NÃO foi feito e precisa ser feito.
Atividade = registro de evento PASSADO: algo que JÁ ocorreu.
Visita técnica = levantamento ou vistoria técnica JÁ realizada no campo. Gera APENAS uma atividade de tipo "visita" na linha do tempo.

REGRA CRÍTICA — SEM DUPLICAÇÃO:
Para um evento que JÁ OCORREU (visita realizada, reunião feita, levantamento concluído):
→ Gere SOMENTE visita_tecnica OU atividade — nunca os dois para o mesmo fato
→ NUNCA gere tarefa descrevendo o mesmo evento passado que já está sendo registrado como visita_tecnica
→ Se houver ação futura DECORRENTE desse evento, gere UMA tarefa separada descrevendo a próxima etapa (ex: "Elaborar proposta comercial")

Exemplo CORRETO: usuário relata visita já feita com Valdecir → gere visita_tecnica + (opcionalmente) tarefa "Elaborar descritivo da proposta"
Exemplo ERRADO: gerar visita_tecnica + tarefa "Registrar visita técnica com Valdecir" (duplicata do mesmo fato)

Se o usuário mencionar visita sem informar data e hora: pergunte antes de gerar qualquer ACTION. Não invente data.

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
    ctx.projetoId ? Promise.resolve([] as Awaited<ReturnType<typeof listAtividadesGlobais>>) : listAtividadesGlobais(empresaId, 8),
    countClientesByEmpresa(empresaId),
    countProjetosByEmpresa(empresaId, "oportunidade"),
    countProjetosByEmpresa(empresaId, "obra"),
  ]);

  type AgendaRow = (typeof agenda)[number];
  type TarefaRow = (typeof tarefas)[number];
  type AtividadeRow = (typeof atividadesGlobais)[number];

  const agendaLines = agenda.length
    ? agenda.map((item: AgendaRow) => {
        const projeto = item.projeto?.titulo ? ` · ${item.projeto.titulo}` : "";
        return `${formatDateTime(item.inicio)} · ${item.titulo}${projeto}`;
      })
    : ["Nenhum compromisso agendado nos próximos 7 dias."];

  const tarefasFiltradas = ctx.projetoId
    ? tarefas.filter((tarefa: TarefaRow) => tarefa.projeto.id === ctx.projetoId)
    : tarefas;
  const tarefaLines = tarefasFiltradas.length
    ? tarefasFiltradas.map((tarefa: TarefaRow) => {
        const prazo = tarefa.dataPrevista ? ` · prazo ${formatDateTime(tarefa.dataPrevista)}` : "";
        return `${tarefa.descricao.split("\n")[0]} · ${tarefa.projeto.titulo}${prazo}`;
      })
    : ["Nenhuma tarefa aberta no contexto atual."];

  let projetoLine = "Nenhum projeto carregado.";
  let timelineLines = atividadesGlobais.length
    ? atividadesGlobais.map((atividade: AtividadeRow) => {
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

function textFromMessageForGroq(message: ChatMessage): string {
  const textParts: string[] = [];
  if (message.content.trim()) {
    textParts.push(message.content.trim());
  }

  const attachments = (message.attachments ?? [])
    .filter(isChatAttachment)
    .slice(0, MAX_ATTACHMENTS_PER_MESSAGE);

  for (const attachment of attachments) {
    const mimeType = attachment.mimeType.split(";")[0];
    if (mimeType === "text/plain" || mimeType === "text/csv" || mimeType === "application/json") {
      const text = Buffer.from(attachment.data, "base64").toString("utf8").slice(0, 20000);
      if (text.trim()) {
        textParts.push(`Arquivo anexado: ${attachment.name}\n${text}`);
      }
    }
  }

  return textParts.length > 0 ? textParts.join("\n\n") : "Mensagem sem texto.";
}

function groqMessagesFromChat(messages: ChatMessage[], systemInstruction: string): ChatCompletionMessageParam[] {
  return [
    { role: "system", content: systemInstruction },
    ...messages.map((message): ChatCompletionMessageParam => ({
      role: message.role === "model" ? "assistant" : "user",
      content: textFromMessageForGroq(message),
    })),
  ];
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const empresaId = getEmpresaId(session);
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 403 });
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

  // gemini-2.0-flash: rápido, correto para chat em tempo real.
  // GEMINI_MODEL_CHAT permite override sem configurar recursos extras do modelo.
  const model = process.env.GEMINI_MODEL_CHAT?.trim() || "gemini-2.0-flash";
  const requestNow = new Date();

  let operationalContext = "Contexto operacional indisponível no momento.";
  try {
    operationalContext = await buildOperationalContext(empresaId, context);
  } catch (ctxError) {
    console.error("[LiaChat:context]", ctxError);
  }

  const systemInstruction = SYSTEM_PROMPT_TEMPLATE(context, operationalContext, requestNow);

  try {
    // withGeminiKeyRotation: tenta cada chave em ordem aleatória;
    // avança para a próxima somente em erro de cota (429/RESOURCE_EXHAUSTED).
    const streamResult = await withGeminiKeyRotation(async (apiKey) => {
      const ai = new GoogleGenAI({ apiKey });
      return ai.models.generateContentStream({
        model,
        contents: messages.map((message) => ({
          role: message.role,
          parts: partsFromMessage(message),
        })),
        config: {
          systemInstruction,
        },
      });
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
          logLiaError("[LiaChat:stream]", error, {
            route: "/api/lia/chat",
            model,
            pathname: context.pathname,
            projetoId: context.projetoId ?? null,
            messageCount: messages.length,
          });
          controller.enqueue(encoder.encode(userMessageForLiaError(error, {
            route: "/api/lia/chat",
            model,
            context,
          })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
        "X-Empresa-Id": empresaId,
      },
    });
  } catch (error) {
    const errorInfo = classifyLiaError(error);

    logLiaError("[LiaChat]", error, {
      route: "/api/lia/chat",
      pathname: context.pathname,
      projetoId: context.projetoId ?? null,
      messageCount: messages.length,
    });

    if (errorInfo.category === "quota") {
      try {
        const groqStreamResult = await withGroqKeyRotation(async (apiKey) => {
          const groq = new Groq({ apiKey });
          return groq.chat.completions.create({
            model: GROQ_FALLBACK_MODEL,
            stream: true,
            messages: groqMessagesFromChat(messages, systemInstruction),
          });
        });

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            try {
              for await (const chunk of groqStreamResult) {
                const text = chunk.choices[0]?.delta.content ?? "";
                if (text) controller.enqueue(encoder.encode(text));
              }
              controller.close();
            } catch (groqStreamError) {
              logLiaError("[LiaChat:groq-stream]", groqStreamError, {
                route: "/api/lia/chat",
                model: GROQ_FALLBACK_MODEL,
                pathname: context.pathname,
                projetoId: context.projetoId ?? null,
                messageCount: messages.length,
              });
              controller.enqueue(encoder.encode("Todos os provedores de IA indisponíveis no momento."));
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Content-Type-Options": "nosniff",
            "X-Empresa-Id": empresaId,
          },
        });
      } catch (groqError) {
        logLiaError("[LiaChat:groq]", groqError, {
          route: "/api/lia/chat",
          model: GROQ_FALLBACK_MODEL,
          pathname: context.pathname,
          projetoId: context.projetoId ?? null,
          messageCount: messages.length,
        });

        return new Response("Todos os provedores de IA indisponíveis no momento.", {
          status: 502,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
    }

    return new Response(userMessageForLiaError(error, {
      route: "/api/lia/chat",
      model,
      context,
    }), {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}
