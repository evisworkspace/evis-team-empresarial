"use client";
import { useState, useTransition } from "react";

type ItemHITL = {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  prioridade: string | null;
  percentual: number | null;
  dataSugerida: Date | null;
  confianca: number;
  motivoDeteccao: string | null;
  status: string;
  createdAt: Date;
};

type Diario = {
  id: string;
  numero: number;
  data: Date;
  status: string;
  descricao: string;
  processado: boolean;
  createdAt: Date;
  itensHITL: ItemHITL[];
};

type Props = {
  projetoId: string;
  diarios: Diario[];
  actions: {
    criarDiario: (fd: FormData) => Promise<void>;
    aprovarItem: (fd: FormData) => Promise<void>;
    rejeitarItem: (fd: FormData) => Promise<void>;
  };
};

const TIPO_LABELS: Record<string, string> = {
  visita: "Visita",
  tarefa: "Tarefa",
  atividade: "Atividade",
  proxima_demanda: "Próxima demanda",
  registro_execucao: "Execução",
  observacao: "Observação",
  problema_obra: "Problema",
};

const TIPO_COLORS: Record<string, string> = {
  visita: "#2563eb",
  tarefa: "#7c3aed",
  atividade: "#059669",
  proxima_demanda: "#d97706",
  registro_execucao: "#0891b2",
  observacao: "#64748b",
  problema_obra: "#dc2626",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatIso(d: Date) {
  return new Date(d).toISOString().split("T")[0];
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export function DiarioTab({ projetoId, diarios, actions }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  const [editing, setEditing] = useState<Record<string, { titulo: string; descricao: string } | null>>({});
  const [confirmedEdits, setConfirmedEdits] = useState<Record<string, { titulo: string; descricao: string }>>({});
  const [expandedRdo, setExpandedRdo] = useState<string | null>(null);

  const pendentes = diarios.flatMap((d) =>
    d.itensHITL.filter((i) => i.status === "pendente").map((i) => ({ ...i, diarioNumero: d.numero, diarioData: d.data }))
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await actions.criarDiario(fd);
        setShowForm(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro ao salvar diário.");
      }
    });
  }

  function handleAprovar(item: typeof pendentes[0]) {
    const edits = confirmedEdits[item.id];
    const fd = new FormData();
    fd.set("itemId", item.id);
    fd.set("projetoId", projetoId);
    fd.set("tipo", item.tipo);
    fd.set("titulo", edits?.titulo ?? item.titulo);
    fd.set("descricao", edits?.descricao ?? (item.descricao ?? item.titulo));
    fd.set("prioridade", item.prioridade ?? "media");
    if (item.dataSugerida) fd.set("dataSugerida", formatIso(item.dataSugerida));
    startTransition(() => actions.aprovarItem(fd));
  }

  function handleRejeitar(itemId: string) {
    const fd = new FormData();
    fd.set("itemId", itemId);
    fd.set("projetoId", projetoId);
    startTransition(() => actions.rejeitarItem(fd));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--clr-text)" }}>Diário de Obra</div>
          <div style={{ fontSize: 12, color: "var(--clr-text-muted)", marginTop: 2 }}>
            RDOs analisados pelo Canteiro IA
          </div>
        </div>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            + Novo RDO
          </button>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: "var(--clr-surface)",
          border: "1px solid var(--clr-border)",
          borderRadius: "var(--r-md)",
          padding: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--clr-text)" }}>
            Novo Registro Diário de Obra
          </div>
          <input type="hidden" name="projetoId" value={projetoId} />

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Data do registro</label>
              <input type="date" name="data" className="form-input" required defaultValue={today()} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Descrição do dia</label>
            <textarea
              name="descricao"
              className="form-input"
              required
              rows={6}
              placeholder="Descreva o que aconteceu hoje na obra. Ex: Pessoal da hidráulica veio e instalou o encanamento do banheiro. Cliente ligou pedindo mudança na cozinha. Faltou areia para o reboco da sala..."
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ fontSize: 12, color: "var(--clr-text-muted)", marginBottom: 16 }}>
            O Canteiro IA vai analisar o texto e sugerir itens para aprovação.
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={pending} className="btn btn-primary">
              {pending ? "Analisando..." : "Salvar e Analisar"}
            </button>
            <button type="button" disabled={pending} onClick={() => setShowForm(false)} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* HITL — Pendentes */}
      {pendentes.length > 0 && (
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--clr-text-muted)",
            marginBottom: 12,
          }}>
            Canteiro IA — {pendentes.length} item{pendentes.length !== 1 ? "s" : ""} para validar
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendentes.map((item) => {
              const cor = TIPO_COLORS[item.tipo] ?? "#64748b";
              const label = TIPO_LABELS[item.tipo] ?? item.tipo;
              const pct = Math.round(Number(item.confianca) * 100);
              const isEditing = !!editing[item.id];
              const edits = confirmedEdits[item.id];
              const displayTitulo = edits?.titulo ?? item.titulo;
              const displayDescricao = edits?.descricao ?? (item.descricao ?? item.titulo);

              return (
                <div key={item.id} style={{
                  border: `1px solid ${cor}33`,
                  borderLeft: `3px solid ${cor}`,
                  borderRadius: "var(--r-md)",
                  padding: "14px 16px",
                  background: "var(--clr-surface)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: cor,
                          background: `${cor}18`,
                          padding: "2px 8px",
                          borderRadius: 99,
                        }}>
                          {label}
                        </span>
                        {item.prioridade && (
                          <span style={{ fontSize: 10, color: "var(--clr-text-muted)" }}>
                            {item.prioridade}
                          </span>
                        )}
                        <span style={{ fontSize: 10, color: "var(--clr-text-muted)", marginLeft: "auto" }}>
                          {pct}% confiança
                        </span>
                      </div>
                      
                      {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                          <input
                            type="text"
                            className="form-input"
                            value={editing[item.id]!.titulo}
                            onChange={(e) => setEditing(prev => ({ ...prev, [item.id]: { ...prev[item.id]!, titulo: e.target.value } }))}
                            placeholder="Título"
                            style={{ fontSize: 13, fontWeight: 600 }}
                          />
                          <textarea
                            className="form-input"
                            value={editing[item.id]!.descricao}
                            onChange={(e) => setEditing(prev => ({ ...prev, [item.id]: { ...prev[item.id]!, descricao: e.target.value } }))}
                            placeholder="Descrição"
                            rows={2}
                            style={{ fontSize: 13, resize: "vertical" }}
                          />
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--clr-text)", marginBottom: 4 }}>
                            {displayTitulo}
                          </div>
                          {displayDescricao && displayDescricao !== displayTitulo && (
                            <div style={{ fontSize: 13, color: "var(--clr-text-secondary)", marginBottom: 6 }}>
                              {displayDescricao}
                            </div>
                          )}
                        </>
                      )}

                      {item.motivoDeteccao && (
                        <div style={{ fontSize: 11, color: "var(--clr-text-muted)", fontStyle: "italic" }}>
                          RDO #{item.diarioNumero} · {formatDate(item.diarioData)} · {item.motivoDeteccao}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmedEdits(prev => ({ ...prev, [item.id]: editing[item.id]! }));
                              setEditing(prev => ({ ...prev, [item.id]: null }));
                            }}
                            style={{
                              padding: "6px 14px",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: "var(--r-sm)",
                              border: "1px solid var(--clr-primary)",
                              background: "var(--clr-primary)",
                              color: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(prev => ({ ...prev, [item.id]: null }))}
                            style={{
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: "var(--r-sm)",
                              border: "1px solid var(--clr-border)",
                              background: "transparent",
                              color: "var(--clr-text-secondary)",
                              cursor: "pointer",
                            }}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditing(prev => ({ ...prev, [item.id]: { titulo: displayTitulo, descricao: displayDescricao } }))}
                            style={{
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: "var(--r-sm)",
                              border: "1px solid var(--clr-border)",
                              background: "transparent",
                              color: "var(--clr-text-secondary)",
                              cursor: pending ? "not-allowed" : "pointer",
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleAprovar(item)}
                            style={{
                              padding: "6px 14px",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: "var(--r-sm)",
                              border: "1px solid var(--clr-success)",
                              background: "var(--clr-success)",
                              color: "#fff",
                              cursor: pending ? "not-allowed" : "pointer",
                            }}
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleRejeitar(item.id)}
                            style={{
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: "var(--r-sm)",
                              border: "1px solid var(--clr-border)",
                              background: "transparent",
                              color: "var(--clr-text-secondary)",
                              cursor: pending ? "not-allowed" : "pointer",
                            }}
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Histórico */}
      {diarios.length === 0 && !showForm && (
        <div className="placeholder-block">
          Nenhum registro diário ainda. Crie o primeiro RDO para começar.
        </div>
      )}

      {diarios.length > 0 && (
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--clr-text-muted)",
            marginBottom: 12,
          }}>
            Histórico de RDOs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {diarios.map((d) => {
              const aprovados = d.itensHITL.filter((i) => i.status === "aprovado").length;
              const rejeitados = d.itensHITL.filter((i) => i.status === "rejeitado").length;
              const isExpanded = expandedRdo === d.id;
              return (
                <div key={d.id} style={{
                  border: "1px solid var(--clr-border)",
                  borderRadius: "var(--r-md)",
                  padding: "12px 16px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--clr-text)" }}>
                          RDO #{d.numero} · {formatDate(d.data)}
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedRdo(isExpanded ? null : d.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            fontSize: 12,
                            color: "var(--clr-primary)",
                            cursor: "pointer",
                            padding: "0 4px",
                          }}
                        >
                          {isExpanded ? "Ocultar itens" : "Ver itens"}
                        </button>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--clr-text-secondary)", marginTop: 4, whiteSpace: "pre-wrap" }}>
                        {d.descricao.length > 180 ? d.descricao.substring(0, 180) + "..." : d.descricao}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                      {aprovados > 0 && (
                        <div style={{ fontSize: 11, color: "var(--clr-success)" }}>{aprovados} aprovado{aprovados !== 1 ? "s" : ""}</div>
                      )}
                      {rejeitados > 0 && (
                        <div style={{ fontSize: 11, color: "var(--clr-text-muted)" }}>{rejeitados} rejeitado{rejeitados !== 1 ? "s" : ""}</div>
                      )}
                      <div style={{ fontSize: 11, color: "var(--clr-text-muted)", marginTop: 2 }}>
                        {new Date(d.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && d.itensHITL.length > 0 && (
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--clr-border-light)", display: "flex", flexDirection: "column", gap: 8 }}>
                      {d.itensHITL.map(item => {
                        const cor = TIPO_COLORS[item.tipo] ?? "#64748b";
                        const label = TIPO_LABELS[item.tipo] ?? item.tipo;
                        return (
                          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: cor,
                              background: `${cor}18`,
                              padding: "2px 6px",
                              borderRadius: 4,
                            }}>
                              {label}
                            </span>
                            <span style={{ color: "var(--clr-text)", fontWeight: 500 }}>{item.titulo}</span>
                            <span style={{
                              marginLeft: "auto",
                              fontSize: 11,
                              color: item.status === "aprovado" ? "var(--clr-success)" : item.status === "rejeitado" ? "var(--clr-danger)" : "var(--clr-text-muted)",
                            }}>
                              {item.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isExpanded && d.itensHITL.length === 0 && (
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--clr-border-light)", fontSize: 12, color: "var(--clr-text-muted)" }}>
                      Nenhum item detectado neste RDO.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
