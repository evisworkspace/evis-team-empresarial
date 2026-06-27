"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { atualizarStatusProjeto } from "@/actions/projeto";
import { STATUS_OPORTUNIDADE, STATUS_OBRA, type StatusConfig } from "@/lib/status";

type Props = {
  projetoId: string;
  stage: string;
  statusAtual: string;
};

export default function StatusDropdown({ projetoId, stage, statusAtual }: Props) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const statusMap = stage === "obra" ? STATUS_OBRA : STATUS_OPORTUNIDADE;
  const cfgAtual = statusMap[statusAtual] ?? { label: statusAtual || "—", cor: "#6b7280", grupo: "ativo" as const };

  const ativos   = Object.entries(statusMap).filter(([, cfg]) => cfg.grupo === "ativo");
  const fechados = Object.entries(statusMap).filter(([, cfg]) => cfg.grupo === "fechado");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Recalcula posição ao scrollar/redimensionar enquanto aberto
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const handleOpen = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left });
    setOpen((v) => !v);
  };

  const select = (slug: string) => {
    if (slug === statusAtual) { setOpen(false); return; }
    startTransition(async () => {
      await atualizarStatusProjeto(projetoId, slug);
      setOpen(false);
    });
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        disabled={isPending}
        className="badge-status"
        style={{
          backgroundColor: cfgAtual.cor + "22",
          color: cfgAtual.cor,
          borderColor: cfgAtual.cor + "44",
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.6 : 1,
          gap: 4,
        }}
      >
        {cfgAtual.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && dropPos && (
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            top: dropPos.top,
            left: dropPos.left,
            zIndex: 9999,
            background: "#fff",
            border: "1px solid var(--clr-border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 190,
            overflow: "hidden",
          }}
        >
          {ativos.length > 0 && (
            <>
              <div style={{ padding: "6px 12px 3px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                Ativos
              </div>
              {ativos.map(([slug, cfg]) => (
                <StatusOption key={slug} slug={slug} cfg={cfg} current={statusAtual} onSelect={select} />
              ))}
            </>
          )}
          {fechados.length > 0 && (
            <>
              <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
              <div style={{ padding: "4px 12px 3px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                Fechados
              </div>
              {fechados.map(([slug, cfg]) => (
                <StatusOption key={slug} slug={slug} cfg={cfg} current={statusAtual} onSelect={select} />
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
}

function StatusOption({
  slug, cfg, current, onSelect,
}: {
  slug: string;
  cfg: StatusConfig;
  current: string;
  onSelect: (s: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(slug)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "8px 12px",
        background: slug === current ? "#f8fafc" : "none",
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        color: slug === current ? cfg.cor : "#374151",
        fontWeight: slug === current ? 600 : 400,
        textAlign: "left",
      }}
      onMouseEnter={(e) => { if (slug !== current) (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; }}
      onMouseLeave={(e) => { if (slug !== current) (e.currentTarget as HTMLButtonElement).style.background = ""; }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 2, background: cfg.cor, flexShrink: 0 }} />
      {cfg.label}
      {slug === current && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "auto" }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}
