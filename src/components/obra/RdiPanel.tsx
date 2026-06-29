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

interface RdiDraft {
  titulo: string;
  resumo: string;
  fatos: string[];
  premissas: string[];
  pendencias: string[];
  escopo: string[];
  riscos: string[];
  proximosPassos: string[];
  tarefasSugeridas: string[];
  tarefasSelecionadas: boolean[];
  anotacaoConteudo: string;
  diarioDescricao: string;
}

function fromOutput(data: RdiOutput): RdiDraft {
  return {
    titulo: data.titulo,
    resumo: data.resumo,
    fatos: data.fatos,
    premissas: data.premissas,
    pendencias: data.pendencias,
    escopo: data.escopo,
    riscos: data.riscos,
    proximosPassos: data.proximosPassos,
    tarefasSugeridas: data.tarefasSugeridas,
    tarefasSelecionadas: data.tarefasSugeridas.map(() => true),
    anotacaoConteudo: data.anotacaoRascunho,
    diarioDescricao: data.diarioRascunho,
  };
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "var(--clr-text-muted, #6b7280)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

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

function ListEditor({ title, items, onChange }: { title: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={sectionLabel}>{title}</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--clr-text-muted)", marginBottom: 5 }}>Sem itens identificados.</div>
      ) : (
        items.map((item, i) => (
          <div key={`${title}-${i}`} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
            <input
              value={item}
              onChange={e => { const next = [...items]; next[i] = e.target.value; onChange(next); }}
              style={inputBase}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onChange(items.filter((_, index) => index !== i))}
              aria-label={`Remover item de ${title}`}
              style={{ flexShrink: 0 }}
            >
              Remover
            </button>
          </div>
        ))
      )}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChange([...items, ""])}
      >
        Adicionar item
      </button>
    </div>
  );
}

export default function RdiPanel({ projetoId, projetoTitulo, onClose }: RdiPanelProps) {
  const [state, setState] = useState<RdiState>("input");
  const [narrativa, setNarrativa] = useState("");
  const [draft, setDraft] = useState<RdiDraft | null>(null);
  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ anotacaoId: string; diarioId: string; tarefasCriadas: number } | null>(null);
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
    const tarefasSelecionadas = draft.tarefasSugeridas.filter((_, i) => draft.tarefasSelecionadas[i]);
    startTransition(async () => {
      const result = await confirmarRdi({
        projetoId,
        titulo: draft.titulo,
        anotacaoConteudo: draft.anotacaoConteudo,
        diarioDescricao: draft.diarioDescricao,
        tarefasSelecionadas,
      });
      if (!result.ok) {
        setError(result.error);
        setState("review");
        return;
      }
      setSuccessInfo({
        anotacaoId: result.anotacaoId,
        diarioId: result.diarioId,
        tarefasCriadas: result.tarefasCriadas,
      });
      setState("success");
    });
  }

  const panelStyle: React.CSSProperties = {
    background: "var(--surface, #fff)",
    border: "1px solid var(--border-color, #e5e7eb)",
    borderRadius: 8,
    padding: 14,
    marginTop: 10,
    fontSize: 13,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  };

  const closeBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
    color: "var(--clr-text-muted, #6b7280)",
    padding: 0,
  };

  if (state === "input" || state === "loading") {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "var(--clr-text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            RDI — Diário de Gestão Interna
          </div>
          {onClose && <button type="button" style={closeBtn} onClick={onClose} aria-label="Fechar RDI">×</button>}
        </div>
        <div style={{ fontSize: 12, color: "var(--clr-text-muted)", marginBottom: 8, lineHeight: 1.45 }}>
          {projetoTitulo} — descreva o contexto em texto livre: o que foi entendido, o que ficou pendente, próximos passos, documentos citados.
        </div>
        <textarea
          value={narrativa}
          onChange={e => setNarrativa(e.target.value)}
          disabled={isWorking}
          placeholder="Ex: Visitei o local hoje com o cliente. A loja tem 45m², pé direito de 3,2m. Foi combinado que..."
          rows={7}
          style={{ ...inputBase, resize: "vertical", lineHeight: 1.5 }}
        />
        {error && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button type="button" className="btn btn-primary btn-sm" disabled={isWorking} onClick={handleAnalisar}>
            {isWorking ? "Analisando..." : "Analisar"}
          </button>
          {onClose && <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>}
        </div>
      </div>
    );
  }

  if ((state === "review" || state === "saving") && draft) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "var(--clr-text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            RDI — Revisão
          </div>
          {onClose && <button type="button" style={closeBtn} onClick={onClose} aria-label="Fechar RDI">×</button>}
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={sectionLabel}>Título</div>
          <input
            value={draft.titulo}
            onChange={e => setDraft(d => d ? { ...d, titulo: e.target.value } : d)}
            style={inputBase}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={sectionLabel}>Resumo</div>
          <textarea
            value={draft.resumo}
            onChange={e => setDraft(d => d ? { ...d, resumo: e.target.value } : d)}
            rows={2}
            style={{ ...inputBase, resize: "vertical" }}
          />
        </div>

        <ListEditor
          title="Fatos confirmados"
          items={draft.fatos}
          onChange={items => setDraft(d => d ? { ...d, fatos: items } : d)}
        />
        <ListEditor
          title="Premissas"
          items={draft.premissas}
          onChange={items => setDraft(d => d ? { ...d, premissas: items } : d)}
        />
        <ListEditor
          title="Pendências"
          items={draft.pendencias}
          onChange={items => setDraft(d => d ? { ...d, pendencias: items } : d)}
        />
        <ListEditor
          title="Escopo técnico"
          items={draft.escopo}
          onChange={items => setDraft(d => d ? { ...d, escopo: items } : d)}
        />
        <ListEditor
          title="Riscos"
          items={draft.riscos}
          onChange={items => setDraft(d => d ? { ...d, riscos: items } : d)}
        />
        <ListEditor
          title="Próximos passos"
          items={draft.proximosPassos}
          onChange={items => setDraft(d => d ? { ...d, proximosPassos: items } : d)}
        />

        {draft.tarefasSugeridas.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={sectionLabel}>Tarefas sugeridas</div>
            {draft.tarefasSugeridas.map((tarefa, i) => (
              <label
                key={i}
                style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 5, cursor: "pointer", fontSize: 12, color: "var(--clr-text)", lineHeight: 1.4 }}
              >
                <input
                  type="checkbox"
                  checked={draft.tarefasSelecionadas[i]}
                  onChange={e => {
                    const next = [...draft.tarefasSelecionadas];
                    next[i] = e.target.checked;
                    setDraft(d => d ? { ...d, tarefasSelecionadas: next } : d);
                  }}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                {tarefa}
              </label>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <div style={sectionLabel}>Anotação (rascunho)</div>
          <textarea
            value={draft.anotacaoConteudo}
            onChange={e => setDraft(d => d ? { ...d, anotacaoConteudo: e.target.value } : d)}
            rows={5}
            style={{ ...inputBase, resize: "vertical", lineHeight: 1.5 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={sectionLabel}>Diário (entrada concisa)</div>
          <textarea
            value={draft.diarioDescricao}
            onChange={e => setDraft(d => d ? { ...d, diarioDescricao: e.target.value } : d)}
            rows={2}
            style={{ ...inputBase, resize: "vertical", lineHeight: 1.5 }}
          />
        </div>

        {error && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 8 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary btn-sm" disabled={isWorking} onClick={handleConfirmar}>
            {isWorking ? "Salvando..." : "Criar registros selecionados"}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={isWorking}
            onClick={() => { setState("input"); setError(""); }}
          >
            Voltar
          </button>
          {onClose && <button type="button" className="btn btn-secondary btn-sm" disabled={isWorking} onClick={onClose}>Cancelar</button>}
        </div>
      </div>
    );
  }

  if (state === "success" && successInfo) {
    return (
      <div style={panelStyle}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--clr-text)", marginBottom: 6 }}>RDI salvo.</div>
        <div style={{ fontSize: 12, color: "var(--clr-text-muted)", lineHeight: 1.5, marginBottom: 12 }}>
          Anotação e entrada no Diário criadas.
          {successInfo.tarefasCriadas > 0
            ? ` ${successInfo.tarefasCriadas} tarefa(s) sugerida(s) criada(s).`
          : ""}
          {" "}Confira nas abas Anotações e Diário deste projeto.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="btn btn-secondary btn-sm" href={`/dashboard/projetos/${projetoId}`}>
            Abrir projeto
          </a>
          <a className="btn btn-secondary btn-sm" href="/dashboard/diario">
            Ver diário
          </a>
          <a className="btn btn-secondary btn-sm" href="/dashboard/tarefas">
            Ver tarefas
          </a>
          {onClose && <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Fechar</button>}
        </div>
      </div>
    );
  }

  return null;
}
