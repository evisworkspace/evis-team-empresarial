"use client";
import { useState, useTransition } from "react";

type Medicao = {
  id: string;
  numero: number;
  dataReferencia: Date;
  observacao: string | null;
  itens: Array<{ itemId: string; percentual: number | null; valorMedido: number | null }>;
};

type ItemOrc = { id: string; descricao: string; nivel: number; parentId: string | null };

type Props = {
  projetoId: string;
  medicoes: Medicao[];
  itensOrcamento: ItemOrc[];
  action: (formData: FormData) => Promise<void>;
};

function formatIso(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function MedicoesTab({ projetoId, medicoes, itensOrcamento, action }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  const mensuraveis = itensOrcamento.filter((i) => i.nivel > 1);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(fd);
        setShowForm(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro ao salvar medição");
      }
    });
  }

  return (
    <div className="obra-card obra-card--full">
      <div className="obra-card-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="obra-card-label">Medições de Avanço</span>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            + Nova Medição
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background: "var(--clr-surface)", padding: 16, borderRadius: "var(--r-md)", border: "1px solid var(--clr-border)", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Criar Nova Medição</div>
          <input type="hidden" name="projetoId" value={projetoId} />
          
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Data de Referência</label>
              <input type="date" name="dataReferencia" className="form-input" required defaultValue={formatIso(new Date())} />
            </div>
            <div style={{ flex: 2 }}>
              <label className="form-label">Observação</label>
              <input type="text" name="observacao" className="form-input" placeholder="Opcional" />
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--clr-text-secondary)" }}>Avanço por Item</div>
          <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--clr-border)", borderRadius: "var(--r-sm)", marginBottom: 16 }}>
            {mensuraveis.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: 12, padding: "8px 12px", borderBottom: "1px solid var(--clr-border-light)", alignItems: "center" }}>
                <div style={{ flex: 1, fontSize: 13 }}>{item.descricao}</div>
                <div style={{ width: 100 }}>
                  <input type="number" name={`pct_${item.id}`} className="form-input" placeholder="% medido" step="0.01" min="0" max="100" style={{ padding: "4px 8px", fontSize: 13 }} />
                </div>
                <div style={{ width: 120 }}>
                  <input type="number" name={`val_${item.id}`} className="form-input" placeholder="R$ (opcional)" step="0.01" min="0" style={{ padding: "4px 8px", fontSize: 13 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={pending} className="btn btn-primary">Salvar Medição</button>
            <button type="button" disabled={pending} onClick={() => setShowForm(false)} className="btn btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {medicoes.length === 0 && !showForm && (
        <div className="placeholder-block">
          Nenhuma medição registrada. Crie a primeira medição de avanço.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {medicoes.map((m) => {
          const validItens = m.itens.filter((i) => i.percentual != null || i.valorMedido != null);
          const avgPct = validItens.length > 0 
            ? validItens.reduce((sum, i) => sum + (i.percentual ?? 0), 0) / validItens.length 
            : 0;
            
          return (
            <div key={m.id} style={{ border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--clr-text)" }}>Medição {m.numero}</div>
                  <div style={{ fontSize: 12, color: "var(--clr-text-muted)", marginTop: 2 }}>Referência: {formatDate(m.dataReferencia)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--clr-success)", fontFamily: "var(--font-mono)" }}>
                    {avgPct.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 11, color: "var(--clr-text-muted)" }}>avanço médio nesta medição</div>
                </div>
              </div>
              {m.observacao && (
                <div style={{ fontSize: 13, color: "var(--clr-text-secondary)", marginBottom: 12 }}>
                  "{m.observacao}"
                </div>
              )}
              {validItens.length > 0 && (
                <details style={{ fontSize: 13 }}>
                  <summary style={{ cursor: "pointer", color: "var(--clr-primary)", fontWeight: 500, outline: "none" }}>Ver itens medidos ({validItens.length})</summary>
                  <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: "2px solid var(--clr-border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
                    {validItens.map(i => {
                      const orcItem = itensOrcamento.find(o => o.id === i.itemId);
                      return (
                        <div key={i.itemId} style={{ display: "flex", justifyContent: "space-between", color: "var(--clr-text-secondary)" }}>
                          <span>{orcItem?.descricao ?? "Item desconhecido"}</span>
                          <span style={{ fontFamily: "var(--font-mono)" }}>
                            {i.percentual != null ? `${Number(i.percentual).toFixed(2)}%` : ""}
                            {i.valorMedido != null ? ` | R$ ${Number(i.valorMedido).toFixed(2)}` : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
