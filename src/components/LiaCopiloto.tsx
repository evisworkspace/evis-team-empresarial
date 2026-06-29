"use client";

import { ClipboardEvent, DragEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { executarAcaoLia } from "@/actions/ai/executarAcaoLia";

type LiaAction = {
  id: string;
  tipo: "tarefa" | "agenda" | "visita_tecnica" | "atividade" | "nova_oportunidade" | "leitura_visita";
  titulo?: string;
  descricao: string;
  dataPrevista?: string;
  tipoAgenda?: string;
  tipoAtividade?: string;
  visitaData?: string;
  visitaHorario?: string;
  visitaParticipantes?: string;
  visitaLocal?: string;
  visitaFatos?: string;
  visitaPremissas?: string;
  visitaPendencias?: string;
  visitaEscopo?: string;
  visitaRiscos?: string;
  visitaTarefas?: string;
  visitaAnotacaoRascunho?: string;
  visitaDiarioRascunho?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  clienteTipoPessoa?: string;
  clienteEmail?: string;
  clienteCpfCnpj?: string;
  clienteRazaoSocial?: string;
  clienteRg?: string;
  clienteDataNascimento?: string;
  clienteCep?: string;
  clienteRua?: string;
  clienteNumero?: string;
  clienteComplemento?: string;
  clienteBairro?: string;
  clienteCidade?: string;
  clienteEstado?: string;
  clienteObservacoes?: string;
  enderecoObra?: string;
  cepObra?: string;
  logradouroObra?: string;
  numeroEnderecoObra?: string;
  complementoObra?: string;
  bairroObra?: string;
  cidadeObra?: string;
  estadoObra?: string;
  tipoObra?: string;
  origem?: string;
  status: "pending" | "confirmed" | "ignored";
};

type LiaMessage = {
  id: string;
  role: "user" | "lia";
  content: string;
  attachments?: LiaAttachment[];
  actions: LiaAction[];
  timestamp: number;
  quickReplies?: Array<{ label: string; href?: string }>;
};

type LiaAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: string;
};

type LiaContext = {
  pathname: string;
  projetoId: string | null;
  projetoTitulo: string | null;
  stage: string | null;
};

interface LiaCopilotoProps {
  mode: "global" | "contextual";
  storageKey: string;
  projetoId?: string;
}

const ACTION_RE = /<!--ACTION:(.*?)-->/g;
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const MAX_HISTORY = 30;
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

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowTimestamp() {
  return Date.now();
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function inferMimeType(file: File) {
  if (file.type) return file.type.split(";")[0];
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".txt")) return "text/plain";
  if (name.endsWith(".csv")) return "text/csv";
  if (name.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function sanitizeVisibleText(value: string) {
  return value
    .replace(ACTION_RE, "")
    .replace(/<!--ACTION:[\s\S]*$/g, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .trim();
}

function parseActionsFromText(raw: string): { text: string; actions: LiaAction[] } {
  const actions: LiaAction[] = [];
  const text = raw.replace(ACTION_RE, (_, json) => {
    try {
      const parsed = JSON.parse(json) as Partial<LiaAction>;
      const tiposValidos = ["tarefa", "agenda", "visita_tecnica", "atividade", "nova_oportunidade", "leitura_visita"];
      const isNovaOportunidade = parsed.tipo === "nova_oportunidade";
      const isLeituraVisita = parsed.tipo === "leitura_visita";
      const hasRequiredField = isNovaOportunidade
        ? typeof parsed.clienteNome === "string" && parsed.clienteNome.trim().length > 0
        : isLeituraVisita
          ? typeof parsed.titulo === "string" && parsed.titulo.trim().length > 0
          : typeof parsed.descricao === "string" && parsed.descricao.trim().length > 0;
      if (typeof parsed.tipo === "string" && tiposValidos.includes(parsed.tipo) && hasRequiredField) {
        actions.push({
          id: makeId(parsed.tipo),
          tipo: parsed.tipo as LiaAction["tipo"],
          titulo: typeof parsed.titulo === "string" ? parsed.titulo.trim() : undefined,
          descricao: typeof parsed.descricao === "string" ? parsed.descricao.trim() : "",
          dataPrevista: typeof parsed.dataPrevista === "string" ? parsed.dataPrevista : undefined,
          tipoAgenda: typeof parsed.tipoAgenda === "string" ? parsed.tipoAgenda : undefined,
          tipoAtividade: typeof parsed.tipoAtividade === "string" ? parsed.tipoAtividade : undefined,
          visitaData: typeof parsed.visitaData === "string" ? parsed.visitaData : undefined,
          visitaHorario: typeof parsed.visitaHorario === "string" ? parsed.visitaHorario : undefined,
          visitaParticipantes: typeof parsed.visitaParticipantes === "string" ? parsed.visitaParticipantes : undefined,
          visitaLocal: typeof parsed.visitaLocal === "string" ? parsed.visitaLocal : undefined,
          visitaFatos: typeof parsed.visitaFatos === "string" ? parsed.visitaFatos : undefined,
          visitaPremissas: typeof parsed.visitaPremissas === "string" ? parsed.visitaPremissas : undefined,
          visitaPendencias: typeof parsed.visitaPendencias === "string" ? parsed.visitaPendencias : undefined,
          visitaEscopo: typeof parsed.visitaEscopo === "string" ? parsed.visitaEscopo : undefined,
          visitaRiscos: typeof parsed.visitaRiscos === "string" ? parsed.visitaRiscos : undefined,
          visitaTarefas: typeof parsed.visitaTarefas === "string" ? parsed.visitaTarefas : undefined,
          visitaAnotacaoRascunho: typeof parsed.visitaAnotacaoRascunho === "string" ? parsed.visitaAnotacaoRascunho : undefined,
          visitaDiarioRascunho: typeof parsed.visitaDiarioRascunho === "string" ? parsed.visitaDiarioRascunho : undefined,
          clienteNome: typeof parsed.clienteNome === "string" ? parsed.clienteNome : undefined,
          clienteTelefone: typeof parsed.clienteTelefone === "string" ? parsed.clienteTelefone : undefined,
          clienteTipoPessoa: typeof parsed.clienteTipoPessoa === "string" ? parsed.clienteTipoPessoa : undefined,
          clienteEmail: typeof parsed.clienteEmail === "string" ? parsed.clienteEmail : undefined,
          clienteCpfCnpj: typeof parsed.clienteCpfCnpj === "string" ? parsed.clienteCpfCnpj : undefined,
          clienteRazaoSocial: typeof parsed.clienteRazaoSocial === "string" ? parsed.clienteRazaoSocial : undefined,
          clienteRg: typeof parsed.clienteRg === "string" ? parsed.clienteRg : undefined,
          clienteDataNascimento: typeof parsed.clienteDataNascimento === "string" ? parsed.clienteDataNascimento : undefined,
          clienteCep: typeof parsed.clienteCep === "string" ? parsed.clienteCep : undefined,
          clienteRua: typeof parsed.clienteRua === "string" ? parsed.clienteRua : undefined,
          clienteNumero: typeof parsed.clienteNumero === "string" ? parsed.clienteNumero : undefined,
          clienteComplemento: typeof parsed.clienteComplemento === "string" ? parsed.clienteComplemento : undefined,
          clienteBairro: typeof parsed.clienteBairro === "string" ? parsed.clienteBairro : undefined,
          clienteCidade: typeof parsed.clienteCidade === "string" ? parsed.clienteCidade : undefined,
          clienteEstado: typeof parsed.clienteEstado === "string" ? parsed.clienteEstado : undefined,
          clienteObservacoes: typeof parsed.clienteObservacoes === "string" ? parsed.clienteObservacoes : undefined,
          enderecoObra: typeof parsed.enderecoObra === "string" ? parsed.enderecoObra : undefined,
          cepObra: typeof parsed.cepObra === "string" ? parsed.cepObra : undefined,
          logradouroObra: typeof parsed.logradouroObra === "string" ? parsed.logradouroObra : undefined,
          numeroEnderecoObra: typeof parsed.numeroEnderecoObra === "string" ? parsed.numeroEnderecoObra : undefined,
          complementoObra: typeof parsed.complementoObra === "string" ? parsed.complementoObra : undefined,
          bairroObra: typeof parsed.bairroObra === "string" ? parsed.bairroObra : undefined,
          cidadeObra: typeof parsed.cidadeObra === "string" ? parsed.cidadeObra : undefined,
          estadoObra: typeof parsed.estadoObra === "string" ? parsed.estadoObra : undefined,
          tipoObra: typeof parsed.tipoObra === "string" ? parsed.tipoObra : undefined,
          origem: typeof parsed.origem === "string" ? parsed.origem : undefined,
          status: "pending",
        });
      }
    } catch {
      return "";
    }
    return "";
  });

  return { text: sanitizeVisibleText(text), actions };
}

async function readLiaErrorResponse(res: Response) {
  const contentType = res.headers.get("Content-Type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const data = await res.json() as { error?: unknown };
      return typeof data.error === "string" && data.error.trim()
        ? data.error.trim()
        : "Erro na API da Lia.";
    }
    const text = await res.text();
    return text.trim() || "Erro na API da Lia.";
  } catch {
    return "Erro na API da Lia.";
  }
}

function readContextFromWindow(): LiaContext {
  if (typeof window === "undefined") {
    return { pathname: "", projetoId: null, projetoTitulo: null, stage: null };
  }

  const pathname = window.location.pathname;
  const projetoIdMatch = pathname.match(/\/dashboard\/projetos\/([^/]+)/);
  const projetoId = projetoIdMatch?.[1] ?? null;
  const projetoTitulo = document.querySelector(".obra-title")?.textContent?.trim() || null;
  const stage = document.querySelector(".badge-oportunidade")
    ? "oportunidade"
    : document.querySelector(".badge-obra")
      ? "obra"
      : null;

  return { pathname, projetoId, projetoTitulo, stage };
}

function splitActionList(value?: string) {
  return (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinActionMeta(items: Array<string | undefined>) {
  return items.filter((item): item is string => Boolean(item && item.trim())).join(" · ");
}

function initialMessage(context: LiaContext, source: "autoOpportunity" | "manual"): LiaMessage {
  const content = source === "autoOpportunity"
    ? "Oportunidade criada. Escreva aqui para registrar os próximos passos, uma tarefa ou uma visita."
    : context.projetoId
      ? "Pronto. Escreva sua solicitação para este projeto."
      : "Olá. Como posso ajudar?";

  const quickReplies: Array<{ label: string; href?: string }> | undefined =
    !context.projetoId && source === "manual"
      ? [
          { label: "Ver minha agenda", href: "/dashboard/agenda" },
          { label: "Ver tarefas abertas", href: "/dashboard/tarefas" },
          { label: "Novo lead", href: "/dashboard/projetos/novo?stage=oportunidade" },
        ]
      : undefined;

  return {
    id: makeId("lia"),
    role: "lia",
    content,
    actions: [],
    timestamp: nowTimestamp(),
    quickReplies,
  };
}

function VisitListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, color: "var(--clr-text-muted)", lineHeight: 1.45 }}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function VisitScopePills({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--clr-text)", marginBottom: 6 }}>
        Escopo técnico
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((item) => (
          <span
            key={item}
            className="badge"
            style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LiaCopiloto({ mode, storageKey, projetoId: projetoIdProp }: LiaCopilotoProps) {
  const HISTORY_KEY = `evis_cache_v1_lia_history_${storageKey}`;

  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<LiaMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<LiaAttachment[]>([]);
  const [attachmentNotice, setAttachmentNotice] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<LiaContext>({
    pathname: "",
    projetoId: null,
    projetoTitulo: null,
    stage: null,
  });
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const autoOpenedRef = useRef<string | null>(null);

  // Contextual mode: init context from prop + DOM on mount and navigation
  useEffect(() => {
    if (mode !== "contextual" || !projetoIdProp) return;
    const fromWindow = readContextFromWindow();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setContext(prev => ({
        ...prev,
        projetoId: projetoIdProp,
        projetoTitulo: fromWindow.projetoTitulo ?? prev.projetoTitulo,
        stage: fromWindow.stage ?? prev.stage,
        pathname: fromWindow.pathname,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [mode, projetoIdProp, pathname]);

  // Handle pathname changes (global mode: skip; contextual: handle lia=1 auto-open)
  useEffect(() => {
    if (mode === "global") return;
    const shouldOpen = window.location.search.includes("lia=1");
    const autoOpenKey = `${window.location.pathname}${window.location.search}`;

    queueMicrotask(() => {
      if (shouldOpen && autoOpenedRef.current !== autoOpenKey) {
        autoOpenedRef.current = autoOpenKey;
        setIsOpen(true);
        if (!projetoIdProp) {
          setMessages((prev) => (prev.length > 0 ? prev : [initialMessage(context, "autoOpportunity")]));
        }
      }
    });
  }, [pathname, mode, projetoIdProp, context]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
    } catch {}
  }, [messages, HISTORY_KEY, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function addFiles(files: File[]) {
    if (files.length === 0) return;

    const next: LiaAttachment[] = [];
    const notices: string[] = [];
    let totalBytes = attachments.reduce((sum, item) => sum + item.size, 0);

    for (const file of files) {
      const mimeType = inferMimeType(file);
      if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
        notices.push(`${file.name}: formato ainda não suportado.`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        notices.push(`${file.name}: limite de ${formatBytes(MAX_ATTACHMENT_BYTES)}.`);
        continue;
      }
      if (attachments.length + next.length >= MAX_ATTACHMENTS) {
        notices.push(`Limite de ${MAX_ATTACHMENTS} anexos por mensagem.`);
        break;
      }
      if (totalBytes + file.size > MAX_TOTAL_BYTES) {
        notices.push(`Limite total de ${formatBytes(MAX_TOTAL_BYTES)} por mensagem.`);
        break;
      }

      const data = await readFileAsBase64(file);
      next.push({
        id: makeId("attach"),
        name: file.name || "audio-lia.webm",
        mimeType,
        size: file.size,
        data,
      });
      totalBytes += file.size;
    }

    if (next.length > 0) {
      setAttachments((prev) => [...prev, ...next].slice(0, MAX_ATTACHMENTS));
    }
    setAttachmentNotice(notices.join(" "));
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));

    if (files.length > 0) {
      event.preventDefault();
      void addFiles(files);
    }
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (Array.from(event.dataTransfer.types).includes("Files")) {
      event.preventDefault();
      setIsDraggingFile(true);
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    if (event.dataTransfer.files.length === 0) return;
    event.preventDefault();
    setIsDraggingFile(false);
    void addFiles(Array.from(event.dataTransfer.files));
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDraggingFile(false);
    }
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setAttachmentNotice("Gravação de áudio indisponível neste navegador.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: preferredType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const file = new File([blob], `audio-lia-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.webm`, {
          type: mimeType,
        });
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        setIsRecording(false);
        void addFiles([file]);
      };

      recorder.start();
      setIsRecording(true);
      setAttachmentNotice("");
    } catch {
      setAttachmentNotice("Não consegui acessar o microfone.");
    }
  }

  async function sendMessage(value: string) {
    const text = value.trim();
    const files = attachments;
    if ((!text && files.length === 0) || isLoading) return;

    const content = text || "Anexo enviado para análise.";

    const userMsg: LiaMessage = {
      id: makeId("user"),
      role: "user",
      content,
      attachments: files,
      actions: [],
      timestamp: nowTimestamp(),
    };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput("");
    setAttachments([]);
    setAttachmentNotice("");
    setIsLoading(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/lia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role === "lia" ? "model" : "user",
            content: message.content,
            attachments: message.attachments?.map((attachment) => ({
              name: attachment.name,
              mimeType: attachment.mimeType,
              size: attachment.size,
              data: attachment.data,
            })),
          })),
          context,
        }),
      });

      if (!res.ok) {
        throw new Error(await readLiaErrorResponse(res));
      }

      if (!res.body) {
        throw new Error("A API da Lia não retornou corpo de resposta.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        full += decoder.decode(chunk, { stream: true });
        setStreamingText(sanitizeVisibleText(full));
      }

      full += decoder.decode();
      const { text: responseText, actions } = parseActionsFromText(full);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId("lia"),
          role: "lia",
          content: responseText || "Certo. Quer que eu transforme isso em uma tarefa ou registro?",
          actions,
          timestamp: nowTimestamp(),
        },
      ]);
      setStreamingText("");
    } catch (error) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : "Erro na conexão com a Lia. Tente novamente.";
      setMessages((prev) => [
        ...prev,
        {
          id: makeId("lia-error"),
          role: "lia",
          content: message,
          actions: [],
          timestamp: nowTimestamp(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  function updateActionStatus(messageId: string, actionId: string, status: LiaAction["status"]) {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              actions: message.actions.map((action) =>
                action.id === actionId ? { ...action, status } : action,
              ),
            }
          : message,
      ),
    );
  }

  function addLiaNote(content: string, quickReplies?: LiaMessage["quickReplies"]) {
    setMessages((prev) => [
      ...prev,
      {
        id: makeId("lia-note"),
        role: "lia",
        content,
        actions: [],
        timestamp: nowTimestamp(),
        quickReplies,
      },
    ]);
  }

  function limparChat() {
    setMessages([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  }

  function openRail() {
    setIsOpen(true);
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      // Try restoring history from localStorage
      try {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as unknown;
          if (Array.isArray(parsed) && (parsed as LiaMessage[]).length > 0) {
            return parsed as LiaMessage[];
          }
        }
      } catch {}
      // No history: show initial message for global, let assessment handle contextual
      if (mode === "global") {
        return [initialMessage({ pathname: "", projetoId: null, projetoTitulo: null, stage: null }, "manual")];
      }
      return [];
    });
  }

  function confirmarAcao(messageId: string, action: LiaAction) {
    // Em modo contextual, projetoIdProp é sempre a fonte correta (URL) — context pode estar desatualizado
    const effectiveProjetoId = projetoIdProp ?? context.projetoId ?? null;

    if (action.tipo === "agenda" && !action.dataPrevista) {
      addLiaNote("Para criar um item de agenda preciso da data e hora. Quando será esse compromisso?");
      return;
    }
    if (action.tipo !== "agenda" && action.tipo !== "nova_oportunidade" && !effectiveProjetoId) {
      addLiaNote("Para confirmar, abra um projeto primeiro.");
      return;
    }

    startTransition(async () => {
      try {
        const evidencia = getActionEvidence(messageId);
        const result = action.tipo === "agenda"
          ? await executarAcaoLia({
              tipo: "agenda",
              titulo: action.titulo,
              descricao: action.descricao,
              dataPrevista: action.dataPrevista ?? "",
              tipoAgenda: action.tipoAgenda,
              projetoId: effectiveProjetoId ?? undefined,
              ...evidencia,
            })
          : action.tipo === "visita_tecnica"
            ? await executarAcaoLia({
                tipo: "visita_tecnica",
                descricao: action.descricao,
                dataPrevista: action.dataPrevista,
                projetoId: effectiveProjetoId!,
                ...evidencia,
              })
            : action.tipo === "leitura_visita"
              ? await executarAcaoLia({
                  tipo: "leitura_visita",
                  titulo: action.titulo,
                  descricao: action.descricao,
                  visitaData: action.visitaData,
                  visitaHorario: action.visitaHorario,
                  visitaParticipantes: action.visitaParticipantes,
                  visitaLocal: action.visitaLocal,
                  visitaFatos: action.visitaFatos,
                  visitaPremissas: action.visitaPremissas,
                  visitaPendencias: action.visitaPendencias,
                  visitaEscopo: action.visitaEscopo,
                  visitaRiscos: action.visitaRiscos,
                  visitaTarefas: action.visitaTarefas,
                  visitaAnotacaoRascunho: action.visitaAnotacaoRascunho,
                  visitaDiarioRascunho: action.visitaDiarioRascunho,
                  projetoId: effectiveProjetoId!,
                  ...evidencia,
                })
            : action.tipo === "tarefa"
              ? await executarAcaoLia({
                  tipo: "tarefa",
                  descricao: action.descricao,
                  dataPrevista: action.dataPrevista,
                  projetoId: effectiveProjetoId!,
                  ...evidencia,
                })
              : action.tipo === "nova_oportunidade"
                ? await executarAcaoLia({
                    tipo: "nova_oportunidade",
                    clienteNome: action.clienteNome || "",
                    clienteTelefone: action.clienteTelefone,
                    clienteTipoPessoa: action.clienteTipoPessoa,
                    clienteEmail: action.clienteEmail,
                    clienteCpfCnpj: action.clienteCpfCnpj,
                    clienteRazaoSocial: action.clienteRazaoSocial,
                    clienteRg: action.clienteRg,
                    clienteDataNascimento: action.clienteDataNascimento,
                    clienteCep: action.clienteCep,
                    clienteRua: action.clienteRua,
                    clienteNumero: action.clienteNumero,
                    clienteComplemento: action.clienteComplemento,
                    clienteBairro: action.clienteBairro,
                    clienteCidade: action.clienteCidade,
                    clienteEstado: action.clienteEstado,
                    clienteObservacoes: action.clienteObservacoes,
                    titulo: action.titulo || "",
                    descricao: action.descricao,
                    enderecoObra: action.enderecoObra,
                    cepObra: action.cepObra,
                    logradouroObra: action.logradouroObra,
                    numeroEnderecoObra: action.numeroEnderecoObra,
                    complementoObra: action.complementoObra,
                    bairroObra: action.bairroObra,
                    cidadeObra: action.cidadeObra,
                    estadoObra: action.estadoObra,
                    tipoObra: action.tipoObra,
                    origem: action.origem,
                    ...evidencia,
                  })
                : await executarAcaoLia({
                    tipo: "atividade",
                    descricao: action.descricao,
                    tipoAtividade: action.tipoAtividade,
                    projetoId: effectiveProjetoId!,
                    ...evidencia,
                  });

        if (result.ok) {
          updateActionStatus(messageId, action.id, "confirmed");
          if (result.projetoId) {
            setContext((prev) => ({ ...prev, projetoId: result.projetoId! }));
          }
          const doneMessage =
            action.tipo === "agenda"
              ? "Feito. Compromisso criado na Agenda."
              : action.tipo === "visita_tecnica"
                ? "Feito. Visita técnica registrada na linha do tempo."
                : action.tipo === "leitura_visita"
                  ? `Feito. Criei a anotação rascunho, o diário rascunho e ${result.tarefasCriadas ?? 0} tarefa(s). Abra Anotações e Diário neste projeto para revisar.`
                  : action.tipo === "tarefa"
                    ? "Feito. Tarefa criada com badge IA."
                    : action.tipo === "nova_oportunidade"
                      ? "Cliente e oportunidade criados. Acesse a oportunidade para continuar."
                      : "Feito. Atividade registrada.";
          addLiaNote(
            doneMessage,
            action.tipo === "leitura_visita"
              ? [
                  { label: "Abrir projeto", href: `/dashboard/projetos/${effectiveProjetoId}` },
                  { label: "Ver tarefas", href: "/dashboard/tarefas" },
                  { label: "Ver diário", href: "/dashboard/diario" },
                ]
              : undefined,
          );
        } else {
          addLiaNote(result.erro ?? "Não consegui executar essa ação.");
        }
      } catch {
        addLiaNote("Erro inesperado ao executar a ação. Tente novamente.");
      }
    });
  }

  function ignorarAcao(messageId: string, actionId: string) {
    updateActionStatus(messageId, actionId, "ignored");
    addLiaNote("Tudo bem. Não criei nada.");
  }

  function getActionEvidence(messageId: string) {
    const actionMessageIndex = messages.findIndex((message) => message.id === messageId);
    const sourceMessage = messages
      .slice(0, actionMessageIndex >= 0 ? actionMessageIndex : messages.length)
      .reverse()
      .find((message) => message.role === "user");

    return {
      entradaOriginal: sourceMessage?.content,
      anexos: sourceMessage?.attachments?.map((attachment) => ({
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
      })),
    };
  }

  const triggerLabel = mode === "global" ? "Lia" : "Lia";

  return (
    <>
      <button
        type="button"
        className={`lia-trigger-btn lia-trigger-btn--${mode}${isOpen ? " lia-trigger-btn--open" : ""}`}
        onClick={openRail}
        aria-label={mode === "global" ? "Abrir Lia global" : "Abrir Lia do projeto"}
      >
        {triggerLabel}
      </button>

      {isOpen && <div className="lia-overlay" onClick={() => setIsOpen(false)} />}

      <aside
        className={`lia-rail lia-rail--${mode}${isOpen ? " lia-rail--open" : ""}${isDraggingFile ? " lia-rail--dragging" : ""}`}
        aria-label="Copiloto Lia"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="lia-rail-header">
          <div>
            <div className="lia-rail-kicker">Lia · EVIS</div>
            <div className="lia-rail-title">
              {context.projetoTitulo ?? (mode === "global" ? "Copiloto operacional" : "Carregando...")}
            </div>
          </div>
          <div className="lia-rail-header-actions">
            <button
              type="button"
              className="lia-header-btn"
              onClick={limparChat}
              title="Nova conversa"
              aria-label="Limpar conversa"
            >
              ↺
            </button>
            <button type="button" className="lia-close-btn" onClick={() => setIsOpen(false)} aria-label="Fechar Lia">
              ×
            </button>
          </div>
        </div>

        <div className="lia-context-bar">
          {context.projetoTitulo
            ? `${context.projetoTitulo} · ${context.stage === "oportunidade" ? "oportunidade" : "obra"}`
            : context.stage === "oportunidade"
              ? "Contexto: oportunidade comercial"
              : context.stage === "obra"
                ? "Contexto: obra em andamento"
                : "Contexto: visão geral"}
        </div>

        <div className="lia-messages">
          {messages.map((message) => (
            <div key={message.id} className="lia-message-group">
              <div className={`lia-msg lia-msg--${message.role === "user" ? "user" : "lia"}`}>
                {message.content}
              </div>
              {message.attachments && message.attachments.length > 0 && (
                <div className="lia-attachment-list lia-attachment-list--sent">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id} className="lia-attachment-chip">
                      <span className="lia-attachment-name">{attachment.name}</span>
                      <span className="lia-attachment-size">{formatBytes(attachment.size)}</span>
                    </div>
                  ))}
                </div>
              )}
              {message.role === "lia" && message.quickReplies && message.quickReplies.length > 0 && messages[messages.length - 1]?.id === message.id && (
                <div className="lia-quick-replies">
                  {message.quickReplies.map((reply) => (
                    <button
                      key={reply.label}
                      type="button"
                      className="lia-quick-reply-btn"
                      disabled={isLoading}
                      onClick={() => {
                        if (reply.href) router.push(reply.href);
                        else void sendMessage(reply.label);
                      }}
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
              )}
              {message.actions.map((action) => (
                <div
                  key={action.id}
                  className={`lia-action-card lia-action-card--${action.status}`}
                >
                  <div className="lia-action-card-type">
                    {action.tipo === "agenda"
                      ? "Agenda sugerida"
                      : action.tipo === "visita_tecnica"
                        ? "Visita técnica sugerida"
                        : action.tipo === "tarefa"
                          ? "Tarefa sugerida"
                          : action.tipo === "nova_oportunidade"
                            ? "NOVA OPORTUNIDADE"
                            : action.tipo === "leitura_visita"
                              ? "LEITURA DE VISITA"
                              : "Atividade sugerida"}
                  </div>
                  {action.tipo === "leitura_visita" ? (
                    <div className="lia-action-card-body" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                      <div style={{ fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>
                        {action.titulo}
                      </div>
                      {joinActionMeta([action.visitaData, action.visitaHorario, action.visitaParticipantes, action.visitaLocal]) && (
                        <div style={{ fontSize: 12, color: "var(--clr-text-muted)", marginBottom: 8 }}>
                          {joinActionMeta([action.visitaData, action.visitaHorario, action.visitaParticipantes, action.visitaLocal])}
                        </div>
                      )}
                      {action.descricao && (
                        <div style={{ color: "var(--clr-text-muted)", lineHeight: 1.45 }}>
                          {action.descricao}
                        </div>
                      )}
                      <VisitListSection title="Fatos confirmados" items={splitActionList(action.visitaFatos)} />
                      <VisitListSection title="Premissas" items={splitActionList(action.visitaPremissas)} />
                      <VisitListSection title="Pendências" items={splitActionList(action.visitaPendencias)} />
                      <VisitScopePills items={splitActionList(action.visitaEscopo)} />
                      <VisitListSection title="Tarefas sugeridas" items={splitActionList(action.visitaTarefas)} />
                      <VisitListSection title="Riscos" items={splitActionList(action.visitaRiscos)} />
                    </div>
                  ) : action.tipo === "nova_oportunidade" ? (
                    <div className="lia-action-card-body" style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "var(--text-secondary)" }}>
                      <p style={{ margin: "0 0 0.25rem" }}><strong>Cliente:</strong> {action.clienteNome}{action.clienteTelefone ? ` · ${action.clienteTelefone}` : ""}</p>
                      {action.clienteCpfCnpj && <p style={{ margin: "0 0 0.25rem" }}><strong>CPF/CNPJ:</strong> {action.clienteCpfCnpj}</p>}
                      {action.clienteEmail && <p style={{ margin: "0 0 0.25rem" }}><strong>E-mail:</strong> {action.clienteEmail}</p>}
                      <p style={{ margin: "0 0 0.25rem" }}><strong>Oportunidade:</strong> {action.titulo}</p>
                      {action.enderecoObra && <p style={{ margin: "0 0 0.25rem" }}><strong>Endereço:</strong> {action.enderecoObra}</p>}
                      {action.descricao && <p className="lia-action-card-desc" style={{ marginTop: "0.5rem", WebkitLineClamp: 3 }}>{action.descricao}</p>}
                    </div>
                  ) : (
                    <div className="lia-action-card-desc">{action.descricao}</div>
                  )}
                  {action.tipo === "agenda" && !action.dataPrevista && (
                    <div className="lia-action-card-meta lia-action-card-meta--warn">
                      Data e hora obrigatórias para agenda. Informe quando confirmar.
                    </div>
                  )}
                  {action.dataPrevista && (
                    <div className="lia-action-card-meta">
                      Data sugerida: {new Date(action.dataPrevista).toLocaleString("pt-BR")}
                    </div>
                  )}
                  <div className="lia-action-card-btns">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={action.status !== "pending" || isPending}
                      onClick={() => confirmarAcao(message.id, action)}
                    >
                      {action.tipo === "leitura_visita" ? "Criar Anotação + Diário + Tarefas" : "Confirmar"}
                    </button>
                    {action.tipo === "leitura_visita" && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={action.status !== "pending" || isPending}
                        onClick={() => addLiaNote("Edite respondendo com os ajustes da leitura de visita. Eu gero um novo card antes de salvar.")}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={action.status !== "pending" || isPending}
                      onClick={() => ignorarAcao(message.id, action.id)}
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {streamingText && <div className="lia-msg lia-msg--lia">{streamingText}</div>}
          {isLoading && !streamingText && <div className="lia-typing">Lia está digitando...</div>}
          <div ref={messagesEndRef} />
        </div>

        <form className="lia-input-area" onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,text/csv,application/json,audio/*"
            className="lia-file-input"
            onChange={(event) => {
              const files = event.target.files ? Array.from(event.target.files) : [];
              event.target.value = "";
              void addFiles(files);
            }}
          />

          {attachments.length > 0 && (
            <div className="lia-attachment-list">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="lia-attachment-chip">
                  <span className="lia-attachment-name">{attachment.name}</span>
                  <span className="lia-attachment-size">{formatBytes(attachment.size)}</span>
                  <button
                    type="button"
                    className="lia-attachment-remove"
                    aria-label={`Remover ${attachment.name}`}
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {attachmentNotice && <div className="lia-attachment-notice">{attachmentNotice}</div>}

          <div className="lia-input-row">
            <button
              type="button"
              className="lia-tool-btn"
              title="Anexar arquivo"
              aria-label="Anexar arquivo"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              +
            </button>
            <button
              type="button"
              className={`lia-tool-btn${isRecording ? " lia-tool-btn--recording" : ""}`}
              title={isRecording ? "Parar gravação" : "Gravar áudio"}
              aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
              disabled={isLoading}
              onClick={toggleRecording}
            >
              {isRecording ? "■" : "●"}
            </button>
            <textarea
              className="lia-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Escreva para a Lia..."
              rows={2}
              disabled={isLoading}
            />
            <button type="submit" className="lia-send-btn" disabled={isLoading || (!input.trim() && attachments.length === 0)}>
              Enviar
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
