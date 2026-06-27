"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { executarAcaoLia } from "@/actions/ai/executarAcaoLia";

type LiaAction = {
  id: string;
  tipo: "tarefa" | "agenda" | "visita_tecnica" | "atividade";
  titulo?: string;
  descricao: string;
  dataPrevista?: string;
  tipoAgenda?: string;
  tipoAtividade?: string;
  status: "pending" | "confirmed" | "ignored";
};

type LiaMessage = {
  id: string;
  role: "user" | "lia";
  content: string;
  actions: LiaAction[];
  timestamp: number;
};

type LiaContext = {
  pathname: string;
  projetoId: string | null;
  projetoTitulo: string | null;
  stage: string | null;
};

const ACTION_RE = /<!--ACTION:(.*?)-->/g;

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
      const tiposValidos = ["tarefa", "agenda", "visita_tecnica", "atividade"];
      if (typeof parsed.tipo === "string" && tiposValidos.includes(parsed.tipo) && typeof parsed.descricao === "string" && parsed.descricao.trim()) {
        actions.push({
          id: makeId(parsed.tipo),
          tipo: parsed.tipo as LiaAction["tipo"],
          titulo: typeof parsed.titulo === "string" ? parsed.titulo.trim() : undefined,
          descricao: parsed.descricao.trim(),
          dataPrevista: typeof parsed.dataPrevista === "string" ? parsed.dataPrevista : undefined,
          tipoAgenda: typeof parsed.tipoAgenda === "string" ? parsed.tipoAgenda : undefined,
          tipoAtividade: typeof parsed.tipoAtividade === "string" ? parsed.tipoAtividade : undefined,
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
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<LiaContext>({
    pathname: "",
    projetoId: null,
    projetoTitulo: null,
    stage: null,
  });
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
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

  async function sendMessage(value: string) {
    const text = value.trim();
    if (!text || isLoading) return;

    const userMsg: LiaMessage = {
      id: makeId("user"),
      role: "user",
      content: text,
      actions: [],
      timestamp: Date.now(),
    };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput("");
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
    if (action.tipo !== "agenda" && !context.projetoId) {
      addLiaNote("Para confirmar, abra um projeto primeiro.");
      return;
    }

    startTransition(async () => {
      const result = action.tipo === "agenda"
        ? await executarAcaoLia({
            tipo: "agenda",
            titulo: action.titulo,
            descricao: action.descricao,
            dataPrevista: action.dataPrevista ?? "",
            tipoAgenda: action.tipoAgenda,
            projetoId: context.projetoId ?? undefined,
          })
        : action.tipo === "visita_tecnica"
          ? await executarAcaoLia({
              tipo: "visita_tecnica",
              descricao: action.descricao,
              dataPrevista: action.dataPrevista,
              projetoId: context.projetoId!,
            })
          : action.tipo === "tarefa"
            ? await executarAcaoLia({
                tipo: "tarefa",
                descricao: action.descricao,
                dataPrevista: action.dataPrevista,
                projetoId: context.projetoId!,
              })
            : await executarAcaoLia({
                tipo: "atividade",
                descricao: action.descricao,
                tipoAtividade: action.tipoAtividade,
                projetoId: context.projetoId!,
              });

      if (result.ok) {
        updateActionStatus(messageId, action.id, "confirmed");
        const doneMessage =
          action.tipo === "agenda"
            ? "Feito. Compromisso criado na Agenda."
            : action.tipo === "visita_tecnica"
              ? "Feito. Visita técnica registrada como tarefa e atividade."
              : action.tipo === "tarefa"
                ? "Feito. Tarefa criada com badge IA."
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

      <aside className={`lia-rail${isOpen ? " lia-rail--open" : ""}`} aria-label="Copiloto Lia">
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
              : "Contexto: dashboard"}
        </div>

        <div className="lia-messages">
          {messages.map((message) => (
            <div key={message.id} className="lia-message-group">
              <div className={`lia-msg lia-msg--${message.role === "user" ? "user" : "lia"}`}>
                {message.content}
              </div>
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
                          : "Atividade sugerida"}
                  </div>
                  <div className="lia-action-card-desc">{action.descricao}</div>
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
          <textarea
            className="lia-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva para a Lia..."
            rows={2}
            disabled={isLoading}
          />
          <button type="submit" className="lia-send-btn" disabled={isLoading || !input.trim()}>
            Enviar
          </button>
        </form>
      </aside>
    </>
  );
}
