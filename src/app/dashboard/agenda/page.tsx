import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listAgendaByEmpresa } from "@/data/agenda";
import { listProjetosByEmpresa } from "@/data/projeto";
import { CalendarIcon } from "@/components/Icons";
import {
  criarAgendaItemAction,
  marcarAgendaItemRealizadoAction,
  cancelarAgendaItemAction,
} from "@/actions/agenda";

export const metadata: Metadata = { title: "Agenda" };

// ─── helpers de data ─────────────────────────────────────────────────────────
function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isAtrasado(inicio: Date, status: string): boolean {
  return status === "agendado" && new Date(inicio) < new Date();
}

function formatDateTimeBR(d: Date): string {
  return new Date(d).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── labels ──────────────────────────────────────────────────────────────────
const TIPO_LABEL: Record<string, string> = {
  compromisso: "Compromisso",
  visita: "Visita",
  reuniao: "Reunião",
  ligacao: "Ligação",
  follow_up: "Follow-up",
  prazo: "Prazo",
  entrega: "Entrega",
  lembrete: "Lembrete",
};

const STATUS_LABEL: Record<string, string> = {
  agendado: "Agendado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

const STATUS_BADGE: Record<string, string> = {
  agendado: "badge-ativo",
  realizado: "badge-fechado",
  cancelado: "badge-perdido",
};

const ORIGEM_LABEL: Record<string, string> = {
  manual: "Manual",
  sugerida_lia: "Sugerida pela Lia",
  sugerida_agente: "Sugerida por agente",
};

type Periodo = "hoje" | "semana" | "proximo" | "todos";

// ─── página ──────────────────────────────────────────────────────────────────
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { periodo: periodoRaw } = await searchParams;

  const periodo = (["hoje", "semana", "proximo", "todos"].includes(periodoRaw ?? "")
    ? periodoRaw
    : "proximo") as Periodo;

  const now = new Date();

  const periodoMap: Record<Periodo, { from?: Date; to?: Date }> = {
    hoje: { from: startOfDay(now), to: endOfDay(now) },
    semana: { from: startOfDay(now), to: addDays(now, 7) },
    proximo: { from: startOfDay(now), to: addDays(now, 30) },
    todos: {},
  };

  const filtro = periodoMap[periodo];

  const [itens, projetos] = await Promise.all([
    listAgendaByEmpresa(empresaId, { from: filtro.from, to: filtro.to, take: 50 }),
    listProjetosByEmpresa(empresaId, { take: 100 }),
  ]);

  const PERIODO_LABELS: Record<Periodo, string> = {
    hoje: "Hoje",
    semana: "Esta semana",
    proximo: "Próximos 30 dias",
    todos: "Todos",
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Agenda</h1>
            <p className="page-subtitle">
              {itens.length} item{itens.length !== 1 ? "s" : ""} · {PERIODO_LABELS[periodo]}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros de período */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(["hoje", "semana", "proximo", "todos"] as Periodo[]).map((p) => (
          <Link
            key={p}
            href={`/dashboard/agenda?periodo=${p}`}
            className={`btn btn-sm ${periodo === p ? "btn-primary" : "btn-secondary"}`}
          >
            {PERIODO_LABELS[p]}
          </Link>
        ))}
      </div>

      {/* Formulário inline de criação */}
      <details className="card card-pad" style={{ marginBottom: 20 }}>
        <summary
          style={{
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            color: "var(--clr-primary)",
            listStyle: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CalendarIcon size={15} />
          + Novo compromisso
        </summary>
        <form
          action={criarAgendaItemAction}
          style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="form-label" htmlFor="ag-titulo">
                Título *
              </label>
              <input
                id="ag-titulo"
                name="titulo"
                className="form-input"
                placeholder="Ex: Visita na obra Rua das Flores"
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="ag-tipo">
                Tipo
              </label>
              <select id="ag-tipo" name="tipo" className="form-input">
                {Object.entries(TIPO_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="form-label" htmlFor="ag-inicio">
                Data e hora *
              </label>
              <input
                id="ag-inicio"
                name="inicio"
                type="datetime-local"
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="ag-projeto">
                Projeto (opcional)
              </label>
              <select id="ag-projeto" name="projetoId" className="form-input">
                <option value="">Sem projeto</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="ag-desc">
              Descrição (opcional)
            </label>
            <textarea
              id="ag-desc"
              name="descricao"
              className="form-input"
              rows={2}
              placeholder="Observações sobre o compromisso..."
            />
          </div>
          <div>
            <button type="submit" className="btn btn-primary btn-sm">
              Criar compromisso
            </button>
          </div>
        </form>
      </details>

      {/* Lista de itens */}
      {itens.length === 0 ? (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">
              <CalendarIcon size={24} />
            </div>
            <div className="empty-state-title">Nenhum compromisso agendado para este período</div>
            <p className="empty-state-sub">
              Crie um compromisso manualmente ou deixe a Lia sugerir durante o Diário.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {itens.map((item) => {
            const atrasado = isAtrasado(item.inicio, item.status);
            const descTruncada = item.descricao
              ? item.descricao.length > 120
                ? item.descricao.slice(0, 120) + "…"
                : item.descricao
              : null;

            return (
              <div
                key={item.id}
                className="card card-pad"
                style={{
                  borderLeft: atrasado
                    ? "3px solid var(--clr-danger)"
                    : "3px solid transparent",
                }}
              >
                {/* Badges */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 6,
                  }}
                >
                  <span className="badge" style={{ fontSize: 11 }}>
                    {TIPO_LABEL[item.tipo] ?? item.tipo}
                  </span>
                  <span className={`badge ${STATUS_BADGE[item.status] ?? "badge"}`}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                  {atrasado && (
                    <span className="badge badge-overdue">⚠ Atrasado</span>
                  )}
                </div>

                {/* Título */}
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: "var(--clr-text)",
                    marginBottom: 4,
                  }}
                >
                  {item.titulo}
                </div>

                {/* Data */}
                <div
                  style={{
                    fontSize: 13,
                    color: atrasado ? "var(--clr-danger)" : "var(--clr-text-secondary)",
                    marginBottom: descTruncada || item.projeto ? 6 : 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <CalendarIcon size={13} />
                  {formatDateTimeBR(item.inicio)}
                </div>

                {/* Descrição */}
                {descTruncada && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--clr-text-muted)",
                      margin: "0 0 6px",
                    }}
                  >
                    {descTruncada}
                  </p>
                )}

                {/* Projeto */}
                {item.projeto && (
                  <div style={{ marginBottom: 6 }}>
                    <Link
                      href={`/dashboard/projetos/${item.projeto.id}`}
                      style={{
                        fontSize: 12,
                        color: "var(--clr-primary)",
                        fontWeight: 500,
                      }}
                    >
                      Projeto: {item.projeto.titulo}
                    </Link>
                  </div>
                )}

                {/* Origem */}
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--clr-text-muted)",
                    marginBottom: item.status === "agendado" ? 10 : 0,
                  }}
                >
                  Origem: {ORIGEM_LABEL[item.origem ?? "manual"] ?? item.origem}
                </div>

                {/* Ações — só se agendado */}
                {item.status === "agendado" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <form action={marcarAgendaItemRealizadoAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="btn btn-sm btn-secondary">
                        Marcar realizado
                      </button>
                    </form>
                    <form action={cancelarAgendaItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="btn btn-sm btn-secondary"
                        style={{ color: "var(--clr-danger)" }}
                      >
                        Cancelar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
