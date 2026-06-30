"use client";

import { useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { processarRdi, type RdiOutput } from "@/actions/ai/processarRdi";
import { confirmarRdi } from "@/actions/ai/confirmarRdi";

interface RdiPanelProps {
  projetoId: string;
  projetoTitulo: string;
  onClose?: () => void;
}

type RdiState = "input" | "loading" | "review" | "saving" | "success";

interface MensagemDraft {
  confirmar: boolean;
  destinatarioTipo: string;
  destinatarioNome: string;
  canalSugerido: string;
  objetivo: string;
  textoRascunho: string;
}

interface AgendaDraft {
  confirmar: boolean;
  titulo: string;
  tipo: string;
  descricao: string;
  dataHora: string;
}

interface RdiDraft {
  titulo: string;
  resumo: string;
  registroInternoAtivo: boolean;
  registroInternoConteudo: string;
  registroInternoConfirmar: boolean;
  rdoAtivo: boolean;
  rdoDescricao: string;
  rdoConfirmar: boolean;
  mensagens: MensagemDraft[];
  tarefasSugeridas: string[];
  tarefasSelecionadas: boolean[];
  agenda: AgendaDraft[];
  anotacaoFormalAtiva: boolean;
  anotacaoFormalTipo: string;
  anotacaoFormalTitulo: string;
  anotacaoFormalConteudo: string;
  anotacaoFormalConfirmar: boolean;
}

function fromOutput(data: RdiOutput): RdiDraft {
  return {
    titulo: data.titulo,
    resumo: data.resumo,
    registroInternoAtivo: data.registroInterno.ativo,
    registroInternoConteudo: data.registroInterno.conteudo,
    registroInternoConfirmar: data.registroInterno.ativo,
    rdoAtivo: data.rdoPublicavel.ativo,
    rdoDescricao: data.rdoPublicavel.descricao,
    rdoConfirmar: data.rdoPublicavel.ativo,
    mensagens: data.mensagens.map((m) => ({ ...m, confirmar: true })),
    tarefasSugeridas: data.tarefasSugeridas,
    tarefasSelecionadas: data.tarefasSugeridas.map(() => true),
    agenda: data.agendaSugerida.map((a) => ({
      confirmar: true,
      titulo: a.titulo,
      tipo: a.tipo,
      descricao: a.descricao,
      dataHora: a.dataHoraSugerida || "",
    })),
    anotacaoFormalAtiva: data.anotacaoFormal.ativo,
    anotacaoFormalTipo: data.anotacaoFormal.tipo,
    anotacaoFormalTitulo: data.anotacaoFormal.titulo,
    anotacaoFormalConteudo: data.anotacaoFormal.conteudo,
    anotacaoFormalConfirmar: data.anotacaoFormal.ativo,
  };
}

const inputBase: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "4px 8px",
  fontSize: 12,
  border: "1px solid var(--border-color, #e5e7eb)",
  borderRadius: 4,
  background: "var(--surface, #fff)",
  color: "var(--clr-text, #111)",
  boxSizing: "border-box",
};

const sectionLabel: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "var(--clr-text-muted, #6b7280)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

const blockCard: CSSProperties = {
  border: "1px solid var(--border-color, #e5e7eb)",
  borderRadius: 6,
  padding: "10px 12px",
  marginBottom: 10,
};

const blockHeaderRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
};

const blockTitle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--clr-text, #111)",
};

const pillStyle = (color: string): CSSProperties => ({
  fontSize: 10,
  padding: "2px 7px",
  borderRadius: "99px",
  background: color === "green" ? "#f0fdf4" : "#f9fafb",
  color: color === "green" ? "#16a34a" : "#6b7280",
  border: `1px solid ${color === "green" ? "#bbf7d0" : "#e5e7eb"}`,
});

const confirmLabel: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  cursor: "pointer",
  fontSize: 12,
  color: "var(--clr-text, #111)",
  userSelect: "none",
};

const canalLabel: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  telefone: "Telefone",
  interno: "Interno",
};

const objetivoLabel: Record<string, string> = {
  confirmacao: "Confirmação",
  devolutiva: "Devolutiva",
  pedido_informacao: "Pedido de informação",
  follow_up: "Follow-up",
  alinhamento: "Alinhamento",
};

const tipoAnotacaoLabel: Record<string, string> = {
  relatorio_visita: "Relatório de visita",
  levantamento: "Levantamento",
  entrega: "Entrega",
  outro: "Documento formal",
};

export default function RdiPanel({ projetoId, projetoTitulo, onClose }: RdiPanelProps) {
  const [state, setState] = useState<RdiState>("input");
  const [narrativa, setNarrativa] = useState("");
  const [draft, setDraft] = useState<RdiDraft | null>(null);
  const [error, setError] = useState("");
  const [successTotal, setSuccessTotal] = useState(0);
  const [tarefasCount, setTarefasCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const isWorking = isPending || state === "loading" || state === "saving";

  function handleAnalisar() {
    if (!narrativa.trim() || narrativa.trim().length < 20) {
      setError("Descreva o contexto com pelo menos algumas frases.");
      return;
    }
    setError("");
    setState("loading");
    startTransition(async () => {
      const result = await processarRdi({ narrativa, projetoId });
      if (!result.ok) {
        setError(result.error);
        setState("input");
        return;
      }
      setDraft(fromOutput(result.data));
      setState("review");
    });
  }

  function handleConfirmar() {
    if (!draft) return;
    setError("");
    setState("saving");
    startTransition(async () => {
      const result = await confirmarRdi({
        projetoId,
        titulo: draft.titulo,
        registroInterno: {
          confirmar: draft.registroInternoConfirmar,
          conteudo: draft.registroInternoConteudo,
        },
        rdoPublicavel: {
          confirmar: draft.rdoConfirmar,
          descricao: draft.rdoDescricao,
        },
        mensagens: draft.mensagens,
        tarefasSelecionadas: draft.tarefasSugeridas.filter((_, i) => draft.tarefasSelecionadas[i]),
        agendaSelecionada: draft.agenda,
        anotacaoFormal: {
          confirmar: draft.anotacaoFormalConfirmar,
          tipo: draft.anotacaoFormalTipo,
          titulo: draft.anotacaoFormalTitulo,
          conteudo: draft.anotacaoFormalConteudo,
        },
      });
      if (!result.ok) {
        setError(result.error);
        setState("review");
        return;
      }
      const total =
        result.registrosInternos +
        result.rdosCriados +
        result.mensagensCriadas +
        result.tarefasCriadas +
        result.agendaItens +
        result.anotacoesCriadas;
      setSuccessTotal(total);
      setTarefasCount(result.tarefasCriadas);
      setState("success");
    });
  }

  const closeBtn: CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
    color: "var(--clr-text-muted, #6b7280)",
    padding: 0,
  };

  const panelHeader: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  };

  const panelTitle: CSSProperties = {
    fontWeight: 700,
    fontSize: 12,
    color: "var(--clr-text)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  // ─── Estado: Input / Loading ────────────────────────────────────────────
  if (state === "input" || state === "loading") {
    return (
      <div style={{ fontSize: 13 }}>
        <div style={panelHeader}>
          <div style={panelTitle}>Registro Operacional</div>
          {onClose && (
            <button type="button" style={closeBtn} onClick={onClose} aria-label="Fechar">
              ×
            </button>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--clr-text-muted)", marginBottom: 8, lineHeight: 1.45 }}>
          {projetoTitulo} — descreva em texto livre: visita, reunião, pendências, decisões, contexto.
        </div>
        <textarea
          value={narrativa}
          onChange={(e) => setNarrativa(e.target.value)}
          disabled={isWorking}
          placeholder="Ex: Visitei o local com o cliente. Loja de 45m², pé-direito 3,2m. Início combinado para outubro..."
          rows={7}
          style={{ ...inputBase, resize: "vertical", lineHeight: 1.5 }}
        />
        {error && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button type="button" className="btn btn-primary btn-sm" disabled={isWorking} onClick={handleAnalisar}>
            {isWorking ? "Analisando..." : "Analisar"}
          </button>
          {onClose && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Estado: Review / Saving ────────────────────────────────────────────
  if ((state === "review" || state === "saving") && draft) {
    return (
      <div style={{ fontSize: 13 }}>
        <div style={panelHeader}>
          <div style={panelTitle}>Revisão — {draft.titulo}</div>
          {onClose && (
            <button type="button" style={closeBtn} onClick={onClose} aria-label="Fechar">
              ×
            </button>
          )}
        </div>

        {draft.resumo && (
          <div
            style={{
              fontSize: 12,
              color: "var(--clr-text-muted)",
              marginBottom: 12,
              lineHeight: 1.5,
            }}
          >
            {draft.resumo}
          </div>
        )}

        {/* Bloco 1 — Registro interno */}
        {draft.registroInternoAtivo && (
          <div style={blockCard}>
            <div style={blockHeaderRow}>
              <span style={blockTitle}>Registro interno</span>
              <label style={confirmLabel}>
                <input
                  type="checkbox"
                  checked={draft.registroInternoConfirmar}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, registroInternoConfirmar: e.target.checked } : d))
                  }
                />
                Confirmar
              </label>
            </div>
            <textarea
              value={draft.registroInternoConteudo}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, registroInternoConteudo: e.target.value } : d))
              }
              rows={5}
              disabled={!draft.registroInternoConfirmar}
              style={{ ...inputBase, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>
        )}

        {/* Bloco 2 — RDO publicável */}
        {draft.rdoAtivo && (
          <div style={blockCard}>
            <div style={blockHeaderRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={blockTitle}>RDO publicável</span>
                <span style={pillStyle("gray")}>Diário de Obra</span>
              </div>
              <label style={confirmLabel}>
                <input
                  type="checkbox"
                  checked={draft.rdoConfirmar}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, rdoConfirmar: e.target.checked } : d))
                  }
                />
                Confirmar
              </label>
            </div>
            <textarea
              value={draft.rdoDescricao}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, rdoDescricao: e.target.value } : d))
              }
              rows={2}
              disabled={!draft.rdoConfirmar}
              style={{ ...inputBase, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>
        )}

        {/* Bloco 3 — Mensagens */}
        {draft.mensagens.length > 0 && (
          <div style={blockCard}>
            <div style={{ ...blockTitle, marginBottom: 10 }}>
              Mensagens sugeridas ({draft.mensagens.length})
            </div>
            {draft.mensagens.map((msg, i) => (
              <div
                key={i}
                style={{
                  borderTop: i > 0 ? "1px solid var(--border-color, #e5e7eb)" : undefined,
                  paddingTop: i > 0 ? 10 : 0,
                  marginTop: i > 0 ? 10 : 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--clr-text-muted)", lineHeight: 1.4 }}>
                    Para: <strong>{msg.destinatarioNome}</strong> via{" "}
                    {canalLabel[msg.canalSugerido] ?? msg.canalSugerido}
                    {" — "}
                    {objetivoLabel[msg.objetivo] ?? msg.objetivo}
                  </div>
                  <label style={confirmLabel}>
                    <input
                      type="checkbox"
                      checked={msg.confirmar}
                      onChange={(e) => {
                        const next = [...draft.mensagens];
                        next[i] = { ...next[i], confirmar: e.target.checked };
                        setDraft((d) => (d ? { ...d, mensagens: next } : d));
                      }}
                    />
                    Confirmar
                  </label>
                </div>
                <textarea
                  value={msg.textoRascunho}
                  onChange={(e) => {
                    const next = [...draft.mensagens];
                    next[i] = { ...next[i], textoRascunho: e.target.value };
                    setDraft((d) => (d ? { ...d, mensagens: next } : d));
                  }}
                  rows={3}
                  disabled={!msg.confirmar}
                  style={{ ...inputBase, resize: "vertical", lineHeight: 1.5 }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Bloco 4 — Tarefas */}
        {draft.tarefasSugeridas.length > 0 && (
          <div style={blockCard}>
            <div style={{ ...blockTitle, marginBottom: 8 }}>Tarefas sugeridas</div>
            {draft.tarefasSugeridas.map((tarefa, i) => (
              <label
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 7,
                  marginBottom: 5,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--clr-text)",
                  lineHeight: 1.4,
                }}
              >
                <input
                  type="checkbox"
                  checked={draft.tarefasSelecionadas[i]}
                  onChange={(e) => {
                    const next = [...draft.tarefasSelecionadas];
                    next[i] = e.target.checked;
                    setDraft((d) => (d ? { ...d, tarefasSelecionadas: next } : d));
                  }}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                {tarefa}
              </label>
            ))}
          </div>
        )}

        {/* Bloco 5 — Agenda */}
        {draft.agenda.length > 0 && (
          <div style={blockCard}>
            <div style={{ ...blockTitle, marginBottom: 10 }}>Agenda sugerida</div>
            {draft.agenda.map((item, i) => (
              <div
                key={i}
                style={{
                  borderTop: i > 0 ? "1px solid var(--border-color, #e5e7eb)" : undefined,
                  paddingTop: i > 0 ? 10 : 0,
                  marginTop: i > 0 ? 10 : 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--clr-text)" }}>
                    {item.titulo}
                  </span>
                  <label style={confirmLabel}>
                    <input
                      type="checkbox"
                      checked={item.confirmar}
                      onChange={(e) => {
                        const next = [...draft.agenda];
                        next[i] = { ...next[i], confirmar: e.target.checked };
                        setDraft((d) => (d ? { ...d, agenda: next } : d));
                      }}
                    />
                    Confirmar
                  </label>
                </div>
                {item.descricao && (
                  <div style={{ fontSize: 11, color: "var(--clr-text-muted)", marginBottom: 6 }}>
                    {item.descricao}
                  </div>
                )}
                <div style={sectionLabel}>
                  Data e hora
                  {item.confirmar && !item.dataHora && (
                    <span style={{ color: "#dc2626", marginLeft: 4, textTransform: "none", fontWeight: 400 }}>
                      (obrigatório para criar na agenda)
                    </span>
                  )}
                </div>
                <input
                  type="datetime-local"
                  value={item.dataHora ? item.dataHora.slice(0, 16) : ""}
                  onChange={(e) => {
                    const next = [...draft.agenda];
                    next[i] = { ...next[i], dataHora: e.target.value };
                    setDraft((d) => (d ? { ...d, agenda: next } : d));
                  }}
                  disabled={!item.confirmar}
                  style={inputBase}
                />
              </div>
            ))}
          </div>
        )}

        {/* Bloco 6 — Anotação formal */}
        {draft.anotacaoFormalAtiva && (
          <div style={blockCard}>
            <div style={blockHeaderRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={blockTitle}>Anotação formal</span>
                <span style={pillStyle("gray")}>
                  {tipoAnotacaoLabel[draft.anotacaoFormalTipo] ?? draft.anotacaoFormalTipo}
                </span>
              </div>
              <label style={confirmLabel}>
                <input
                  type="checkbox"
                  checked={draft.anotacaoFormalConfirmar}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, anotacaoFormalConfirmar: e.target.checked } : d))
                  }
                />
                Confirmar
              </label>
            </div>
            <div style={{ ...sectionLabel, marginBottom: 4 }}>Título</div>
            <input
              value={draft.anotacaoFormalTitulo}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, anotacaoFormalTitulo: e.target.value } : d))
              }
              disabled={!draft.anotacaoFormalConfirmar}
              style={{ ...inputBase, marginBottom: 8 }}
            />
            <div style={sectionLabel}>Conteúdo</div>
            <textarea
              value={draft.anotacaoFormalConteudo}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, anotacaoFormalConteudo: e.target.value } : d))
              }
              rows={5}
              disabled={!draft.anotacaoFormalConfirmar}
              style={{ ...inputBase, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>
        )}

        {error && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 8 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={isWorking}
            onClick={handleConfirmar}
          >
            {isWorking ? "Salvando..." : "Criar registros selecionados"}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={isWorking}
            onClick={() => {
              setState("input");
              setError("");
            }}
          >
            Voltar
          </button>
          {onClose && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={isWorking}
              onClick={onClose}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Estado: Success ─────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div style={{ fontSize: 13 }}>
        <div style={{ fontWeight: 700, color: "var(--clr-text)", marginBottom: 6 }}>
          Registro salvo.
        </div>
        <div style={{ fontSize: 12, color: "var(--clr-text-muted)", lineHeight: 1.5, marginBottom: 12 }}>
          {successTotal} registro(s) criado(s).
          {tarefasCount > 0 && ` ${tarefasCount} tarefa(s) na aba Tarefas.`}
          {" "}Confira nas abas correspondentes deste projeto.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setState("input");
              setNarrativa("");
              setDraft(null);
              setError("");
            }}
          >
            Novo registro
          </button>
          {onClose && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Fechar
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
