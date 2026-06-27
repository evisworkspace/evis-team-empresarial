"use client";

import { ClipboardEvent, DragEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { executarAcaoLia } from "@/actions/ai/executarAcaoLia";

type LiaAction = {
  id: string;
  tipo: "tarefa" | "agenda" | "visita_tecnica" | "atividade" | "nova_oportunidade";
  titulo?: string;
  descricao: string;
  dataPrevista?: string;
  tipoAgenda?: string;
  tipoAtividade?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  enderecoObra?: string;
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

const ACTION_RE = /<!--ACTION:(.*?)-->/g;
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
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
      const tiposValidos = ["tarefa", "agenda", "visita_tecnica", "atividade", "nova_oportunidade"];
      if (typeof parsed.tipo === "string" && tiposValidos.includes(parsed.tipo) && typeof parsed.descricao === "string" && parsed.descricao.trim()) {
        actions.push({
          id: makeId(parsed.tipo),
          tipo: parsed.tipo as LiaAction["tipo"],
          titulo: typeof parsed.titulo === "string" ? parsed.titulo.trim() : undefined,
          descricao: parsed.descricao.trim(),
          dataPrevista: typeof parsed.dataPrevista === "string" ? parsed.dataPrevista : undefined,
          tipoAgenda: typeof parsed.tipoAgenda === "string" ? parsed.tipoAgenda : undefined,
          tipoAtividade: typeof parsed.tipoAtividade === "string" ? parsed.tipoAtividade : undefined,
          clienteNome: typeof parsed.clienteNome === "string" ? parsed.clienteNome : undefined,
          clienteTelefone: typeof parsed.clienteTelefone === "string" ? parsed.clienteTelefone : undefined,
          enderecoObra: typeof parsed.enderecoObra === "string" ? parsed.enderecoObra : undefined,
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

function initialMessage(context: LiaContext, source: "autoOpportunity" | "manual"): LiaMessage {
  const content = source === "autoOpportunity"
    ? "Oportunidade criada! Quer que eu sugira os próximos passos para avançar com este projeto?"
    : context.projetoId
      ? "Estou no contexto deste projeto com você. Quer que eu sugira um próximo passo?"
    : "Olá! Estou aqui para ajudar. O que você precisa fazer agora?";

  return {
    id: makeId("lia"),
    role: "lia",
    content,
    actions: [],
    timestamp: Date.now(),
  };
}

export default function LiaCopiloto() {
  const pathname = usePathname();
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

  useEffect(() => {
    const nextContext = readContextFromWindow();
    const shouldOpen = window.location.search.includes("lia=1");
    const autoOpenKey = `${window.location.pathname}${window.location.search}`;

    queueMicrotask(() => {
      setContext(nextContext);

      if (shouldOpen && autoOpenedRef.current !== autoOpenKey) {
        autoOpenedRef.current = autoOpenKey;
        setIsOpen(true);
        setMessages((prev) => (prev.length > 0 ? prev : [initialMessage(nextContext, "autoOpportunity")]));
      }
    });
  }, [pathname]);

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
      timestamp: Date.now(),
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

      if (!res.ok || !res.body) {
        throw new Error("Erro na API da Lia");
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
          timestamp: Date.now(),
        },
      ]);
      setStreamingText("");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId("lia-error"),
          role: "lia",
          content: "Erro na conexão com a Lia. Tente novamente.",
          actions: [],
          timestamp: Date.now(),
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

  function addLiaNote(content: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: makeId("lia-note"),
        role: "lia",
        content,
        actions: [],
        timestamp: Date.now(),
      },
    ]);
  }

  function openRail() {
    const nextContext = readContextFromWindow();
    setContext(nextContext);
    setIsOpen(true);
    setMessages((prev) => (prev.length > 0 ? prev : [initialMessage(nextContext, "manual")]));
  }

  function confirmarAcao(messageId: string, action: LiaAction) {
    if (action.tipo === "agenda" && !action.dataPrevista) {
      addLiaNote("Para criar um item de agenda preciso da data e hora. Quando será esse compromisso?");
      return;
    }
    if (action.tipo !== "agenda" && action.tipo !== "nova_oportunidade" && !context.projetoId) {
      addLiaNote("Para confirmar, abra um projeto primeiro.");
      return;
    }

    startTransition(async () => {
      const evidencia = getActionEvidence(messageId);
      const result = action.tipo === "agenda"
        ? await executarAcaoLia({
            tipo: "agenda",
            titulo: action.titulo,
            descricao: action.descricao,
            dataPrevista: action.dataPrevista ?? "",
            tipoAgenda: action.tipoAgenda,
            projetoId: context.projetoId ?? undefined,
            ...evidencia,
          })
        : action.tipo === "visita_tecnica"
          ? await executarAcaoLia({
              tipo: "visita_tecnica",
              descricao: action.descricao,
              dataPrevista: action.dataPrevista,
              projetoId: context.projetoId!,
              ...evidencia,
            })
          : action.tipo === "tarefa"
            ? await executarAcaoLia({
                tipo: "tarefa",
                descricao: action.descricao,
                dataPrevista: action.dataPrevista,
                projetoId: context.projetoId!,
                ...evidencia,
              })
            : action.tipo === "nova_oportunidade"
              ? await executarAcaoLia({
                  tipo: "nova_oportunidade",
                  clienteNome: action.clienteNome || "",
                  clienteTelefone: action.clienteTelefone,
                  titulo: action.titulo || "",
                  descricao: action.descricao,
                  enderecoObra: action.enderecoObra,
                  tipoObra: action.tipoObra,
                  origem: action.origem,
                  ...evidencia,
                })
              : await executarAcaoLia({
                  tipo: "atividade",
                  descricao: action.descricao,
                  tipoAtividade: action.tipoAtividade,
                  projetoId: context.projetoId!,
                  ...evidencia,
                });

      if (result.ok) {
        updateActionStatus(messageId, action.id, "confirmed");
        if (result.projetoId) {
          setContext(prev => ({ ...prev, projetoId: result.projetoId! }));
        }
        const doneMessage =
          action.tipo === "agenda"
            ? "Feito. Compromisso criado na Agenda."
            : action.tipo === "visita_tecnica"
              ? "Feito. Visita técnica registrada como tarefa e atividade."
              : action.tipo === "tarefa"
                ? "Feito. Tarefa criada com badge IA."
                : action.tipo === "nova_oportunidade"
                  ? "Cliente e oportunidade criados. Acesse a oportunidade para continuar."
                  : "Feito. Atividade registrada.";
        addLiaNote(doneMessage);
      } else {
        addLiaNote(result.erro ?? "Não consegui executar essa ação.");
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

  return (
    <>
      <button
        type="button"
        className={`lia-trigger-btn${isOpen ? " lia-trigger-btn--open" : ""}`}
        onClick={openRail}
        aria-label="Abrir Lia"
      >
        Lia
      </button>

      {isOpen && <div className="lia-overlay" onClick={() => setIsOpen(false)} />}

      <aside
        className={`lia-rail${isOpen ? " lia-rail--open" : ""}${isDraggingFile ? " lia-rail--dragging" : ""}`}
        aria-label="Copiloto Lia"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="lia-rail-header">
          <div>
            <div className="lia-rail-kicker">Lia · EVIS</div>
            <div className="lia-rail-title">
              {context.projetoTitulo ?? "Copiloto operacional"}
            </div>
          </div>
          <button type="button" className="lia-close-btn" onClick={() => setIsOpen(false)} aria-label="Fechar Lia">
            ×
          </button>
        </div>

        <div className="lia-context-bar">
          {context.stage === "oportunidade"
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
                            : "Atividade sugerida"}
                  </div>
                  {action.tipo === "nova_oportunidade" ? (
                    <div className="lia-action-card-body" style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "var(--text-secondary)" }}>
                      <p style={{ margin: "0 0 0.25rem" }}><strong>Cliente:</strong> {action.clienteNome}{action.clienteTelefone ? ` · ${action.clienteTelefone}` : ""}</p>
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
                      Confirmar
                    </button>
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
