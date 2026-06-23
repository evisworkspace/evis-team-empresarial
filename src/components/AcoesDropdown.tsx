"use client";
import { useState, useRef, useEffect } from "react";

export default function AcoesDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-secondary"
        style={{ display: "flex", alignItems: "center", gap: 5 }}
      >
        Ações
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "calc(100% + 6px)",
          background: "#fff",
          border: "1px solid var(--clr-border)",
          borderRadius: "var(--r-lg)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          minWidth: 180,
          zIndex: 50,
          overflow: "hidden",
        }}>
          <a
            href="/dashboard/projetos/export-csv"
            download
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              fontSize: 13,
              color: "var(--clr-text)",
              textDecoration: "none",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#f8fafc"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ""; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar CSV
          </a>
          <a
            href="/dashboard/projetos/export-csv?format=excel"
            download
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              fontSize: 13,
              color: "var(--clr-text)",
              textDecoration: "none",
              transition: "background 0.1s",
              borderTop: "1px solid var(--clr-border-light)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#f8fafc"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ""; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            Exportar Excel
          </a>
        </div>
      )}
    </div>
  );
}
