"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { finalizarProjeto, cancelarProjeto, excluirProjeto } from "@/actions/projeto";

type Props = {
  projetoId: string;
  stage: string;
  titulo: string;
};

export default function ProjetoAcoes({ projetoId, stage, titulo }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmExcluir, setConfirmExcluir] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const menuWidth = 190;
      const menuHeight = 118;
      const gap = 6;
      const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, r.right - menuWidth));
      const hasSpaceBelow = r.bottom + gap + menuHeight <= window.innerHeight - 8;
      const top = hasSpaceBelow ? r.bottom + gap : Math.max(8, r.top - menuHeight - gap);
      setDropPos({ top, left });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const toggleOpen = () => {
    if (!btnRef.current) return;
    setOpen((v) => !v);
  };

  const act = (action: (fd: FormData) => Promise<void>) => {
    const fd = new FormData();
    fd.set("projetoId", projetoId);
    fd.set("stage", stage);
    setOpen(false);
    startTransition(() => action(fd));
  };

  return (
    <>
      <div style={{ display: "inline-block" }}>
        <button
          ref={btnRef}
          type="button"
          onClick={toggleOpen}
          disabled={isPending}
          title="Ações"
          style={{
            padding: "4px 6px",
            border: "none",
            background: "none",
            cursor: isPending ? "default" : "pointer",
            color: "var(--clr-text-muted)",
            borderRadius: "var(--r-md)",
            opacity: isPending ? 0.4 : 1,
            display: "flex",
            alignItems: "center",
            lineHeight: 0,
            transition: "background 0.1s, color 0.1s",
          }}
          onMouseEnter={(e) => { if (!isPending) { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; (e.currentTarget as HTMLButtonElement).style.color = "var(--clr-text)"; } }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = "var(--clr-text-muted)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {open && dropPos && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          top: dropPos.top,
          left: dropPos.left,
          background: "#fff",
          border: "1px solid var(--clr-border)",
          borderRadius: "var(--r-lg)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          minWidth: 190,
          zIndex: 9999,
          overflow: "hidden",
        }} ref={dropRef}>
          <MenuItem
            onClick={() => act(finalizarProjeto)}
            label={stage === "oportunidade" ? "Marcar como Ganho" : "Finalizar obra"}
            color="var(--clr-success)"
          />
          <MenuItem
            onClick={() => act(cancelarProjeto)}
            label={stage === "oportunidade" ? "Arquivar" : "Cancelar obra"}
            color="var(--clr-warning)"
          />
          <div style={{ height: 1, background: "#f1f5f9" }} />
          <MenuItem
            onClick={() => { setOpen(false); setConfirmExcluir(true); }}
            label="Arquivar"
            color="var(--clr-danger)"
          />
        </div>,
        document.body,
      )}

      {confirmExcluir && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setConfirmExcluir(false)}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--clr-border)",
              borderRadius: "var(--r-xl)",
              padding: "28px 32px",
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--clr-text)", marginBottom: 8 }}>
              Arquivar projeto?
            </div>
            <p style={{ fontSize: 14, color: "var(--clr-text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
              <strong>{titulo}</strong> será removido das listagens operacionais. A trilha de auditoria será preservada.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => { setConfirmExcluir(false); act(excluirProjeto); }}
                disabled={isPending}
                style={{
                  padding: "9px 18px",
                  background: "var(--clr-danger)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--r-md)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                Arquivar projeto
              </button>
              <button
                type="button"
                onClick={() => setConfirmExcluir(false)}
                style={{
                  padding: "9px 18px",
                  background: "transparent",
                  color: "var(--clr-text-secondary)",
                  border: "1px solid var(--clr-border)",
                  borderRadius: "var(--r-md)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuItem({ onClick, label, color }: { onClick: () => void; label: string; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        padding: "9px 14px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        color: color ?? "var(--clr-text)",
        textAlign: "left",
        fontWeight: 500,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
    >
      {label}
    </button>
  );
}
