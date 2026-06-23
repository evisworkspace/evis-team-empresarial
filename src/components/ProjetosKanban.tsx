"use client";
import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { moverStatusObra } from "@/actions/projeto";

type Projeto = {
  id: string;
  titulo: string;
  numeroObra: string | null;
  statusInterno: string;
  tipoObra: string | null;
  valorEstimado: unknown;
  createdAt: Date;
  dataInicioEstimada: Date | null;
  cliente: { id: string; nome: string } | null;
};

type StatusCol = { id: string; slug: string; label: string; cor: string; ativo: boolean };

function fmtValor(v: number): string {
  const n = v;
  if (!n || isNaN(n) || n === 0) return "R$ 0";
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `R$ ${(n / 1_000).toFixed(0)}k`;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

function IcoMore() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
    </svg>
  );
}

function IcoBuilding() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1"/>
      <path d="M9 22V12h6v10"/>
      <path d="M9 6h.01M15 6h.01M9 10h.01M15 10h.01"/>
    </svg>
  );
}

function CardMenu({
  projetoId, currentStatus, colunas, onStatusChange, onClose,
}: {
  projetoId: string; currentStatus: string; colunas: StatusCol[];
  onStatusChange: (s: string) => void; onClose: () => void;
}) {
  const outros = colunas.filter((c) => c.slug !== currentStatus);
  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8,
    padding: "9px 14px", fontSize: 12, color: "#374151",
    textDecoration: "none", background: "none", border: "none",
    width: "100%", textAlign: "left", cursor: "pointer",
  };
  const hover = (e: React.MouseEvent) => ((e.currentTarget as HTMLElement).style.background = "#f8fafc");
  const leave = (e: React.MouseEvent) => ((e.currentTarget as HTMLElement).style.background = "");

  return (
    <div style={{
      width: 190, background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      overflow: "hidden",
    }}>
      <Link href={`/dashboard/projetos/${projetoId}`} style={rowStyle} onClick={onClose}
        onMouseEnter={hover} onMouseLeave={leave}>
        Abrir obra
      </Link>
      <Link href={`/dashboard/projetos/${projetoId}/editar`}
        style={{ ...rowStyle, borderTop: "1px solid #f1f5f9" }}
        onClick={onClose} onMouseEnter={hover} onMouseLeave={leave}>
        Editar
      </Link>
      {outros.length > 0 && (
        <>
          <div style={{
            borderTop: "1px solid #f1f5f9", padding: "6px 14px 3px",
            fontSize: 9, fontWeight: 700, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Mudar status
          </div>
          {outros.map((c) => (
            <button key={c.slug} style={rowStyle} onMouseEnter={hover} onMouseLeave={leave}
              onClick={() => { onStatusChange(c.slug); onClose(); }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c.cor, flexShrink: 0 }} />
              {c.label}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function ProjetoCard({ projeto, colunas }: { projeto: Projeto; colunas: StatusCol[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleStatusChange = (novoStatus: string) => {
    startTransition(async () => { await moverStatusObra(projeto.id, novoStatus); });
  };

  return (
    <div
      style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
        padding: "11px 12px", opacity: isPending ? 0.5 : 1,
        transition: "opacity 0.15s, box-shadow 0.15s, border-color 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#cbd5e1"; el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)"; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#e2e8f0"; el.style.boxShadow = "none"; }}
      onClick={() => router.push(`/dashboard/projetos/${projeto.id}`)}
    >
      {/* Título + menu */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4, marginBottom: 3 }}>
        <Link
          href={`/dashboard/projetos/${projeto.id}`}
          style={{
            fontWeight: 600, fontSize: 13, color: "#111827", textDecoration: "none",
            lineHeight: 1.4, flex: 1, minWidth: 0, overflow: "hidden",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {projeto.titulo}
        </Link>
        <button
          style={{ flexShrink: 0, padding: "2px 2px", borderRadius: 4, background: "none", border: "none", cursor: "pointer", color: "#3b82f6" }}
          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#eff6ff"; }}
          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "none"; }}
          onClick={(e) => {
            e.stopPropagation();
            if (menuPos) { setMenuPos(null); return; }
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPos({ top: rect.bottom + 4, left: Math.max(rect.right - 190, 8) });
          }}
        >
          <IcoMore />
        </button>
      </div>

      {/* Cliente */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", marginBottom: 6 }}>
        <IcoBuilding />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {projeto.cliente?.nome ?? "Sem cliente"}
        </span>
      </div>

      {/* Tipo */}
      {projeto.tipoObra && (
        <span style={{
          display: "inline-block", fontSize: 10, background: "#f1f5f9", color: "#64748b",
          border: "1px solid #e2e8f0", borderRadius: 20, padding: "2px 7px",
          fontWeight: 600, marginBottom: 8,
        }}>
          {projeto.tipoObra}
        </span>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
        <span style={{ fontSize: 10, color: "#9ca3af" }}>
          {fmtDate(projeto.createdAt)}
        </span>
        {Number(projeto.valorEstimado) > 0 && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "#374151" }}>
            {fmtValor(Number(projeto.valorEstimado))}
          </span>
        )}
      </div>

      {/* Menu via portal */}
      {menuPos && mounted && createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onPointerDown={(e) => { e.stopPropagation(); setMenuPos(null); }} />
          <div style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}>
            <CardMenu
              projetoId={projeto.id}
              currentStatus={projeto.statusInterno}
              colunas={colunas}
              onStatusChange={handleStatusChange}
              onClose={() => setMenuPos(null)}
            />
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

export default function ProjetosKanban({ projetos, colunas }: { projetos: Projeto[]; colunas: StatusCol[] }) {
  const cols = colunas.filter((c) => c.ativo);

  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
      {cols.map((col) => {
        const cards = projetos.filter((p) => p.statusInterno === col.slug);
        const totalValor = cards.reduce((s, p) => s + (Number(p.valorEstimado) || 0), 0);

        return (
          <div
            key={col.slug}
            style={{
              width: 240, minWidth: 240, background: "#fff",
              border: "1px solid #e2e8f0", borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: col.cor, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: "#111827", flex: 1 }}>{col.label}</span>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                {totalValor > 0 ? `${fmtValor(totalValor)} · ` : ""}{cards.length} obra{cards.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Nova obra */}
            <Link
              href={`/dashboard/projetos/novo?stage=obra`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "7px 12px", margin: "8px 8px 0",
                background: `${col.cor}10`, border: `1.5px dashed ${col.cor}40`,
                borderRadius: 8, fontSize: 11, fontWeight: 700, color: col.cor,
                textDecoration: "none", letterSpacing: "0.04em",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = `${col.cor}1e`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = `${col.cor}10`; }}
            >
              + Nova obra
            </Link>

            {/* Cards */}
            <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 8, minHeight: 120 }}>
              {cards.length === 0 ? (
                <div style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1.5px dashed #e2e8f0", borderRadius: 8, padding: "28px 12px",
                  color: "#d1d5db", fontSize: 11, textAlign: "center", minHeight: 80,
                }}>
                  Nenhuma obra neste status.
                </div>
              ) : (
                cards.map((p) => <ProjetoCard key={p.id} projeto={p} colunas={cols} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
