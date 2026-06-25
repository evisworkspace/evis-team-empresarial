"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { finalizarProjeto, cancelarProjeto, excluirProjeto } from "@/actions/projeto";

type Props = {
  projetoId: string;
  stage: string;
  titulo: string;
};

export default function ProjetoAcoes({ projetoId, stage, titulo }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmExcluir, setConfirmExcluir] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const act = (action: (fd: FormData) => Promise<void>) => {
    const fd = new FormData();
    fd.set("projetoId", projetoId);
    fd.set("stage", stage);
    setOpen(false);
    startTransition(() => action(fd));
  };

  return (
    <>
      <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
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

        {open && (
          <div style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            background: "#fff",
            border: "1px solid var(--clr-border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 170,
            zIndex: 50,
            overflow: "hidden",
          }}>
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
              label="Excluir"
              color="var(--clr-danger)"
            />
          </div>
        )}
      </div>

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
              Excluir projeto?
            </div>
            <p style={{ fontSize: 14, color: "var(--clr-text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
              <strong>{titulo}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
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
                Excluir definitivamente
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
