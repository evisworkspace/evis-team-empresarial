"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  colunas: { slug: string; label: string; cor: string }[];
  statusAtivos: string[];
  baseUrl: string;
};

export default function FiltrarStatusPanel({ colunas, statusAtivos, baseUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(statusAtivos);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setSelected(statusAtivos);
  }, [statusAtivos.join(",")]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function apply() {
    const url = selected.length > 0
      ? `${baseUrl}&statusFiltro=${selected.join(",")}`
      : baseUrl;
    setOpen(false);
    router.push(url);
  }

  function clear() {
    setSelected([]);
    setOpen(false);
    router.push(baseUrl);
  }

  const temFiltro = statusAtivos.length > 0;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => { setSelected(statusAtivos); setOpen((v) => !v); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          borderRadius: "var(--r-md)",
          border: `1px solid ${temFiltro ? "var(--clr-primary)" : "var(--clr-border)"}`,
          background: temFiltro ? "var(--clr-primary-light, #eff6ff)" : "#fff",
          color: temFiltro ? "var(--clr-primary)" : "var(--clr-text-secondary)",
          fontSize: 13,
          fontWeight: temFiltro ? 700 : 400,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 5h14M6 10h8M9 15h2" strokeLinecap="round" />
        </svg>
        Filtrar{temFiltro ? ` (${statusAtivos.length})` : ""}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          zIndex: 50,
          background: "#fff",
          border: "1px solid var(--clr-border)",
          borderRadius: "var(--r-md)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          width: 240,
          padding: "12px 0",
        }}>
          <div style={{ padding: "0 14px 8px", fontWeight: 700, fontSize: 12, color: "var(--clr-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Filtrar por status
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {colunas.map((col) => (
              <label
                key={col.slug}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 14px",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--clr-text)",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(col.slug)}
                  onChange={() => toggle(col.slug)}
                  style={{ accentColor: col.cor }}
                />
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: col.cor,
                    flexShrink: 0,
                  }}
                />
                {col.label}
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 14px 0", borderTop: "1px solid var(--clr-border)", marginTop: 6 }}>
            <button
              type="button"
              onClick={apply}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: "var(--r-sm)",
                background: "var(--clr-primary)",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={clear}
              style={{
                padding: "7px 12px",
                borderRadius: "var(--r-sm)",
                background: "#f1f5f9",
                color: "var(--clr-text-secondary)",
                border: "none",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
