"use client";
import { useState, useTransition } from "react";

type Item = {
  id: string;
  descricao: string;
  nivel: number;
  posicao: number;
  parentId: string | null;
  dataInicioPlano: Date | null;
  dataFimPlano: Date | null;
  diasDuracao: number | null;
  responsavel: string | null;
  custoTotal: number | null;
};

type Props = {
  projetoId: string;
  itens: Item[];
  action: (formData: FormData) => Promise<void>;
};

function formatIso(d: Date | null) {
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatCurrency(v: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function PlanejamentoTab({ projetoId, itens, action }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (itens.length === 0) {
    return (
      <div className="placeholder-block">
        Nenhum item de orçamento com planejamento. Adicione itens ao Orçamento primeiro.
      </div>
    );
  }

  // Calculate totals for level 1 (parent level)
  function sumChildrenCusto(parentId: string): number {
    return itens
      .filter((i) => i.parentId === parentId)
      .reduce((sum, child) => {
        if (child.nivel === 3) return sum + (child.custoTotal ?? 0);
        return sum + sumChildrenCusto(child.id);
      }, 0);
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await action(fd);
      setEditingId(null);
    });
  }

  return (
    <div className="obra-card obra-card--full">
      <div className="obra-card-header">
        <span className="obra-card-label">Planejamento Temporal</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 60px 90px 90px 120px 100px 50px",
          gap: 8,
          padding: "8px 12px",
          borderBottom: "2px solid var(--clr-border)",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          color: "var(--clr-text-muted)",
        }}
      >
        <span>Item</span>
        <span style={{ textAlign: "right" }}>Dias</span>
        <span>Início</span>
        <span>Fim</span>
        <span>Responsável</span>
        <span style={{ textAlign: "right" }}>Custo</span>
        <span></span>
      </div>
      {itens.map((item) => {
        const isLevel1 = item.nivel === 1;
        const isEditing = editingId === item.id;
        const custo = isLevel1 ? sumChildrenCusto(item.id) : item.custoTotal;

        if (isEditing) {
          return (
            <form
              key={item.id}
              onSubmit={handleSave}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 60px 90px 90px 120px 100px 50px",
                gap: 8,
                padding: "8px 12px",
                background: "var(--clr-surface)",
                borderBottom: "1px solid var(--clr-border-light)",
                alignItems: "center",
              }}
            >
              <input type="hidden" name="projetoId" value={projetoId} />
              <input type="hidden" name="id" value={item.id} />
              <div style={{ fontSize: 13, fontWeight: 500, paddingLeft: item.nivel > 1 ? (item.nivel - 1) * 16 : 0 }}>
                {item.descricao}
              </div>
              <input
                type="number"
                name="diasDuracao"
                className="form-input"
                defaultValue={item.diasDuracao ?? ""}
                placeholder="Dias"
                style={{ padding: "4px 6px", fontSize: 12 }}
              />
              <input
                type="date"
                name="dataInicioPlano"
                className="form-input"
                defaultValue={formatIso(item.dataInicioPlano)}
                style={{ padding: "4px 6px", fontSize: 12 }}
              />
              <input
                type="date"
                name="dataFimPlano"
                className="form-input"
                defaultValue={formatIso(item.dataFimPlano)}
                style={{ padding: "4px 6px", fontSize: 12 }}
              />
              <input
                type="text"
                name="responsavel"
                className="form-input"
                defaultValue={item.responsavel ?? ""}
                placeholder="Responsável"
                style={{ padding: "4px 6px", fontSize: 12 }}
              />
              <div style={{ textAlign: "right", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--clr-text-muted)" }}>
                {formatCurrency(custo)}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button type="submit" disabled={pending} className="btn btn-primary btn-sm" style={{ padding: "2px 6px", fontSize: 11 }}>
                  ✓
                </button>
                <button type="button" disabled={pending} onClick={() => setEditingId(null)} className="btn btn-secondary btn-sm" style={{ padding: "2px 6px", fontSize: 11 }}>
                  ✕
                </button>
              </div>
            </form>
          );
        }

        return (
          <div
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 60px 90px 90px 120px 100px 50px",
              gap: 8,
              padding: "8px 12px",
              borderBottom: "1px solid var(--clr-border-light)",
              alignItems: "center",
              fontSize: 13,
              background: isLevel1 ? "var(--clr-surface-hover)" : "transparent",
            }}
          >
            <div style={{ paddingLeft: item.nivel > 1 ? (item.nivel - 1) * 16 : 0, fontWeight: isLevel1 ? 700 : 400, color: "var(--clr-text)" }}>
              {item.descricao}
            </div>
            {isLevel1 ? (
              <>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </>
            ) : (
              <>
                <span style={{ textAlign: "right", color: "var(--clr-text-secondary)" }}>{item.diasDuracao ?? "—"}</span>
                <span style={{ color: "var(--clr-text-secondary)" }}>{formatDate(item.dataInicioPlano)}</span>
                <span style={{ color: "var(--clr-text-secondary)" }}>{formatDate(item.dataFimPlano)}</span>
                <span style={{ color: "var(--clr-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.responsavel ?? "—"}</span>
              </>
            )}
            <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: isLevel1 ? 700 : 400, color: isLevel1 ? "var(--clr-success)" : "var(--clr-text-muted)" }}>
              {formatCurrency(custo)}
            </span>
            <div>
              {!isLevel1 && (
                <button
                  type="button"
                  onClick={() => setEditingId(item.id)}
                  style={{ background: "none", border: "none", color: "var(--clr-primary)", cursor: "pointer", fontSize: 12, padding: "2px 6px" }}
                >
                  Editar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
