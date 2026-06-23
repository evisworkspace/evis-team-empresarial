"use client";
import { useState, useTransition, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  criarStatusProjeto,
  toggleAtivoStatus,
  moverOrdemStatus,
  excluirStatus,
  editarCorStatus,
  editarLabelStatus,
} from "@/actions/statusProjeto";
import type { StatusProjetoData } from "@/data/statusProjeto";

const PALETTE = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f97316",
  "#eab308", "#10b981", "#14b8a6", "#0ea5e9",
  "#dc2626", "#6b7280", "#64748b", "#d97706",
  "#059669", "#7c3aed", "#ef4444", "#0284c7",
];

function IcoSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IcoX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IcoUp()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>; }
function IcoDown() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>; }
function IcoTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
function IcoDots() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
      <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
      <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
    </svg>
  );
}

function ColorPicker({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onSelect(c)}
          style={{
            width: 22, height: 22, borderRadius: 4, background: c,
            border: selected === c ? "2.5px solid #111" : "2px solid transparent",
            cursor: "pointer", padding: 0,
          }}
        />
      ))}
    </div>
  );
}

type StatusRow = StatusProjetoData;

function StatusItem({
  item, isFirst, isLast, onMoveUp, onMoveDown, onToggle, onDelete, onEditLabel, onEditCor,
}: {
  item: StatusRow;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onEditLabel: (label: string) => void;
  onEditCor: (cor: string) => void;
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelVal, setLabelVal] = useState(item.label);
  const [showCor, setShowCor] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLabelVal(item.label); }, [item.label]);

  const commitLabel = () => {
    setEditingLabel(false);
    if (labelVal.trim().length >= 2 && labelVal.trim() !== item.label) {
      onEditLabel(labelVal.trim());
    } else {
      setLabelVal(item.label);
    }
  };

  const row: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 7, padding: "9px 12px",
    borderBottom: "1px solid #f1f5f9",
  };

  return (
    <div>
      <div style={row}>
        <span style={{ color: "#d1d5db", cursor: "grab", flexShrink: 0, lineHeight: 0 }}><IcoDots /></span>

        {/* color dot — click to change color */}
        <button
          type="button"
          onClick={() => setShowCor((v) => !v)}
          style={{
            width: 12, height: 12, borderRadius: 3, background: item.cor, border: "none",
            cursor: "pointer", flexShrink: 0, padding: 0,
          }}
          title="Alterar cor"
        />

        {/* label */}
        {editingLabel ? (
          <input
            ref={inputRef}
            value={labelVal}
            onChange={(e) => setLabelVal(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => { if (e.key === "Enter") commitLabel(); if (e.key === "Escape") { setEditingLabel(false); setLabelVal(item.label); } }}
            autoFocus
            style={{ flex: 1, fontSize: 13, border: "1px solid #93c5fd", borderRadius: 4, padding: "2px 6px", outline: "none" }}
          />
        ) : (
          <span
            style={{ flex: 1, fontSize: 13, color: "#374151", cursor: "text", userSelect: "none" }}
            onDoubleClick={() => setEditingLabel(true)}
            title="Duplo clique para editar"
          >
            {item.label}
          </span>
        )}

        {/* up/down */}
        <button type="button" onClick={onMoveUp} disabled={isFirst}
          style={{ padding: "2px 4px", border: "none", background: "none", cursor: isFirst ? "default" : "pointer", color: isFirst ? "#d1d5db" : "#64748b", lineHeight: 0 }}
          title="Mover para cima"
        ><IcoUp /></button>
        <button type="button" onClick={onMoveDown} disabled={isLast}
          style={{ padding: "2px 4px", border: "none", background: "none", cursor: isLast ? "default" : "pointer", color: isLast ? "#d1d5db" : "#64748b", lineHeight: 0 }}
          title="Mover para baixo"
        ><IcoDown /></button>

        {/* toggle / delete */}
        <button type="button" onClick={onToggle}
          style={{ fontSize: 10, padding: "3px 7px", border: "1px solid #e2e8f0", borderRadius: 5, background: "#f8fafc", color: "#64748b", cursor: "pointer", whiteSpace: "nowrap" }}
          title={item.ativo ? "Desativar" : "Ativar"}
        >
          {item.ativo ? "Desativar" : "Ativar"}
        </button>
        <button type="button" onClick={onDelete}
          style={{ padding: "3px 5px", border: "none", background: "none", cursor: "pointer", color: "#f87171", lineHeight: 0 }}
          title="Excluir"
        ><IcoTrash /></button>
      </div>

      {/* inline color picker */}
      {showCor && (
        <div style={{ padding: "8px 12px 10px 32px", borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
          <ColorPicker selected={item.cor} onSelect={(c) => { onEditCor(c); setShowCor(false); }} />
        </div>
      )}
    </div>
  );
}

function NovoStatusForm({ stage, ativo, onDone }: { stage: string; ativo: boolean; onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [cor, setCor] = useState("#3b82f6");
  const [error, setError] = useState("");

  const submit = () => {
    if (label.trim().length < 2) { setError("Nome mínimo 2 caracteres."); return; }
    setError("");
    const fd = new FormData();
    fd.set("stage", stage);
    fd.set("label", label.trim());
    fd.set("cor", cor);
    fd.set("ativo", String(ativo));
    startTransition(async () => {
      await criarStatusProjeto(fd);
      router.refresh();
      onDone();
    });
  };

  return (
    <div style={{ padding: "10px 12px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onDone(); }}
        placeholder="Nome do status..."
        autoFocus
        style={{
          width: "100%", border: "1px solid #cbd5e1", borderRadius: 6,
          padding: "6px 10px", fontSize: 13, outline: "none", marginBottom: 6, boxSizing: "border-box",
        }}
      />
      <ColorPicker selected={cor} onSelect={setCor} />
      {error && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 5 }}>{error}</div>}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          style={{ fontSize: 12, padding: "5px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}
        >
          {isPending ? "Criando..." : "Criar"}
        </button>
        <button type="button" onClick={onDone}
          style={{ fontSize: 12, padding: "5px 10px", background: "none", border: "1px solid #e2e8f0", borderRadius: 5, cursor: "pointer", color: "#64748b" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Panel({
  statuses: initialStatuses, stage, onClose,
}: {
  statuses: StatusRow[];
  stage: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statuses, setStatuses] = useState(initialStatuses);
  const [addingAtivo, setAddingAtivo] = useState(false);
  const [addingInativo, setAddingInativo] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { setStatuses(initialStatuses); }, [initialStatuses]);

  const act = (fn: () => Promise<void>) => {
    setErrorMsg("");
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Erro desconhecido.");
      }
    });
  };

  const ativos   = statuses.filter((s) => s.ativo).sort((a, b) => a.ordem - b.ordem);
  const inativos = statuses.filter((s) => !s.ativo).sort((a, b) => a.ordem - b.ordem);

  const stageLabel = stage === "obra" ? "obras" : "oportunidades";

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 10000 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 380,
        background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
        zIndex: 10001, display: "flex", flexDirection: "column", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Gerenciar status</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Configure os status das suas {stageLabel}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, lineHeight: 0 }}>
            <IcoX />
          </button>
        </div>

        {errorMsg && (
          <div style={{ margin: "10px 16px", padding: "9px 12px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, color: "#b91c1c" }}>
            {errorMsg}
          </div>
        )}

        {/* Status ativos */}
        <div style={{ padding: "14px 16px 6px", fontFamily: "var(--font-mono, monospace)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
          Status ativos
        </div>

        <div style={{ opacity: isPending ? 0.5 : 1 }}>
          {ativos.map((item, idx) => (
            <StatusItem
              key={item.id}
              item={item}
              isFirst={idx === 0}
              isLast={idx === ativos.length - 1}
              onMoveUp={() => act(() => moverOrdemStatus(item.id, "up"))}
              onMoveDown={() => act(() => moverOrdemStatus(item.id, "down"))}
              onToggle={() => act(() => toggleAtivoStatus(item.id))}
              onDelete={() => act(() => excluirStatus(item.id))}
              onEditLabel={(label) => {
                const fd = new FormData(); fd.set("id", item.id); fd.set("label", label);
                act(() => editarLabelStatus(fd));
              }}
              onEditCor={(cor) => {
                const fd = new FormData(); fd.set("id", item.id); fd.set("cor", cor);
                act(() => editarCorStatus(fd));
              }}
            />
          ))}

          {addingAtivo ? (
            <NovoStatusForm stage={stage} ativo={true} onDone={() => setAddingAtivo(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setAddingAtivo(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "#3b82f6", fontWeight: 600, width: "100%", textAlign: "left",
              }}
            >
              + Novo status ativo
            </button>
          )}
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: "#e2e8f0", margin: "8px 0" }} />

        {/* Status inativos */}
        <div style={{ padding: "6px 16px", fontFamily: "var(--font-mono, monospace)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
          Status inativos
        </div>
        <div style={{ padding: "0 16px 6px", fontSize: 11, color: "#94a3b8" }}>
          Não aparecem nas visualizações por padrão.
        </div>

        <div style={{ opacity: isPending ? 0.5 : 1 }}>
          {inativos.map((item, idx) => (
            <StatusItem
              key={item.id}
              item={item}
              isFirst={idx === 0}
              isLast={idx === inativos.length - 1}
              onMoveUp={() => act(() => moverOrdemStatus(item.id, "up"))}
              onMoveDown={() => act(() => moverOrdemStatus(item.id, "down"))}
              onToggle={() => act(() => toggleAtivoStatus(item.id))}
              onDelete={() => act(() => excluirStatus(item.id))}
              onEditLabel={(label) => {
                const fd = new FormData(); fd.set("id", item.id); fd.set("label", label);
                act(() => editarLabelStatus(fd));
              }}
              onEditCor={(cor) => {
                const fd = new FormData(); fd.set("id", item.id); fd.set("cor", cor);
                act(() => editarCorStatus(fd));
              }}
            />
          ))}

          {addingInativo ? (
            <NovoStatusForm stage={stage} ativo={false} onDone={() => setAddingInativo(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setAddingInativo(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "#64748b", fontWeight: 600, width: "100%", textAlign: "left",
              }}
            >
              + Novo status inativo
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function GerenciarStatusBotao({
  statuses,
  stage,
}: {
  statuses: StatusRow[];
  stage: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-secondary"
        style={{ padding: "0 10px", display: "flex", alignItems: "center", gap: 4 }}
        title="Gerenciar status"
      >
        <IcoSettings />
      </button>

      {open && mounted && createPortal(
        <Panel statuses={statuses} stage={stage} onClose={() => setOpen(false)} />,
        document.body,
      )}
    </>
  );
}
