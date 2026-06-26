"use client";

import { useMemo, useState } from "react";
import { confirmarProposicaoLia } from "@/actions/ai/confirmarProposicaoLia";

type ProjetoOption = {
  id: string;
  titulo: string;
  codigoSequencial: string | null;
};

type ProposicaoLia = {
  titulo: string;
  descricao: string;
  tipo_dispatch: string;
  projeto_mencionado?: string;
  data_sugerida?: string;
  horario_sugerido?: string;
  confianca?: number;
  motivo?: string;
};

interface Props {
  proposicoesEncoded?: string;
  total?: string;
  totalOriginal?: string;
  confirmados?: string;
  projetos: ProjetoOption[];
}

const TIPO_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  tarefa: { label: "Tarefa", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  visita: { label: "Visita", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  reuniao: { label: "Reunião", color: "#7e22ce", bg: "#faf5ff", border: "#e9d5ff" },
  nota: { label: "Nota", color: "#475569", bg: "#f8fafc", border: "#cbd5e1" },
  lead: { label: "Novo lead", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  financeiro: { label: "Financeiro", color: "#a16207", bg: "#fefce8", border: "#fde68a" },
  documento: { label: "Documento", color: "#334155", bg: "#f8fafc", border: "#e2e8f0" },
};

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function parseProposicoes(encoded?: string) {
  if (!encoded) return [];

  try {
    const parsed = JSON.parse(decodeBase64Url(encoded));
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item): ProposicaoLia | null => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        return {
          titulo: String(record.titulo ?? "").trim(),
          descricao: String(record.descricao ?? "").trim(),
          tipo_dispatch: String(record.tipo_dispatch ?? "nota").trim(),
          projeto_mencionado: String(record.projeto_mencionado ?? "").trim(),
          data_sugerida: String(record.data_sugerida ?? "").trim(),
          horario_sugerido: String(record.horario_sugerido ?? "").trim(),
          confianca: typeof record.confianca === "number" ? record.confianca : undefined,
          motivo: String(record.motivo ?? "").trim(),
        };
      })
      .filter((item): item is ProposicaoLia => Boolean(item?.titulo && item.descricao));
  } catch {
    return [];
  }
}

function projetoDefault(projetos: ProjetoOption[], mencionado?: string) {
  const termo = mencionado?.trim().toLowerCase();
  if (!termo) return "";
  return projetos.find((projeto) => projeto.titulo.toLowerCase().includes(termo))?.id ?? "";
}

export default function LiaHitlPanel({
  proposicoesEncoded,
  total,
  totalOriginal,
  confirmados,
  projetos,
}: Props) {
  const initialItems = useMemo(() => parseProposicoes(proposicoesEncoded), [proposicoesEncoded]);
  const [items, setItems] = useState(initialItems);

  const confirmedCount = Number(confirmados ?? 0);
  const totalCount = Number(totalOriginal ?? total ?? initialItems.length);

  if (!proposicoesEncoded) return null;

  if (items.length === 0) {
    return (
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--clr-text)", marginBottom: 8 }}>
          Revisão da Lia concluída
        </div>
        <a href="/dashboard/diario" className="btn btn-secondary btn-sm">Voltar ao Diário</a>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--clr-primary)", marginBottom: 6,
          }}>
            Lia · revisão humana
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>
            Proposições encontradas
          </h2>
        </div>
        <div style={{ fontSize: 12, color: "var(--clr-text-muted)", whiteSpace: "nowrap" }}>
          {confirmedCount} de {totalCount} confirmados
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item, index) => {
          const meta = TIPO_META[item.tipo_dispatch] ?? TIPO_META.nota;
          const remainingItems = items.filter((_, itemIndex) => itemIndex !== index);
          const remainingEncoded = remainingItems.length
            ? encodeBase64Url(JSON.stringify(remainingItems))
            : "";

          return (
            <form
              key={`${item.tipo_dispatch}-${item.titulo}-${index}`}
              action={confirmarProposicaoLia}
              style={{
                border: "1px solid var(--clr-border)",
                borderRadius: "var(--r-md)",
                padding: 14,
                background: "var(--clr-bg)",
              }}
            >
              <input type="hidden" name="tipo_dispatch" value={item.tipo_dispatch} />
              <input type="hidden" name="remainingProposicoes" value={remainingEncoded} />
              <input type="hidden" name="remainingTotal" value={String(remainingItems.length)} />
              <input type="hidden" name="totalOriginal" value={String(totalCount)} />
              <input type="hidden" name="confirmedCount" value={String(confirmedCount + 1)} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <span style={{
                  border: `1px solid ${meta.border}`,
                  background: meta.bg,
                  color: meta.color,
                  borderRadius: 999,
                  padding: "3px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  {meta.label}
                </span>
                {typeof item.confianca === "number" && (
                  <span style={{ fontSize: 11, color: "var(--clr-text-muted)" }}>
                    {Math.round(item.confianca * 100)}% confiança
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">Título</label>
                <input name="titulo" className="form-input" defaultValue={item.titulo} required maxLength={120} />
              </div>

              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">Descrição</label>
                <textarea name="descricao" className="form-input form-textarea" defaultValue={item.descricao} required rows={3} maxLength={1200} />
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
                marginBottom: 10,
              }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Projeto</label>
                  <select
                    name="projetoId"
                    className="form-input form-select"
                    defaultValue={projetoDefault(projetos, item.projeto_mencionado)}
                  >
                    <option value="">Selecionar projeto...</option>
                    {projetos.map((projeto) => (
                      <option key={projeto.id} value={projeto.id}>
                        {projeto.codigoSequencial ? `${projeto.codigoSequencial} · ` : ""}{projeto.titulo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Data</label>
                  <input name="data_sugerida" type="date" className="form-input" defaultValue={item.data_sugerida ?? ""} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Hora</label>
                  <input name="horario_sugerido" type="time" className="form-input" defaultValue={item.horario_sugerido ?? ""} />
                </div>
              </div>

              {(item.projeto_mencionado || item.motivo) && (
                <div style={{ fontSize: 11, color: "var(--clr-text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                  {item.projeto_mencionado && <div>Projeto mencionado: {item.projeto_mencionado}</div>}
                  {item.motivo && <div>Origem: {item.motivo}</div>}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setItems(remainingItems)}
                >
                  Descartar
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Confirmar
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
