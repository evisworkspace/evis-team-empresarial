import Link from "next/link";
import { listAgendaByEmpresa } from "@/data/agenda";
import { CalendarIcon, MapPinIcon } from "@/components/Icons";

type AgendaAction = (formData: FormData) => Promise<void>;

type Props = {
  projetoId: string;
  empresaId: string;
  criarAgendaItemAction: AgendaAction;
  marcarAgendaItemRealizadoAction: AgendaAction;
  cancelarAgendaItemAction: AgendaAction;
};

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

export async function AgendaTab({
  projetoId,
  empresaId,
  criarAgendaItemAction,
  marcarAgendaItemRealizadoAction,
  cancelarAgendaItemAction,
}: Props) {
  const itens = await listAgendaByEmpresa(empresaId, { projetoId, take: 50 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--clr-text)" }}>
            Agenda do projeto
          </div>
          <div style={{ fontSize: 12, color: "var(--clr-text-muted)", marginTop: 2 }}>
            {itens.length} compromisso{itens.length !== 1 ? "s" : ""} neste projeto
          </div>
        </div>
        <Link href="/dashboard/agenda" className="btn btn-secondary btn-sm">
          Ver agenda global
        </Link>
      </div>

      <details className="card card-pad">
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
          <input type="hidden" name="projetoId" value={projetoId} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="form-label" htmlFor="ag-tab-titulo">
                Título *
              </label>
              <input
                id="ag-tab-titulo"
                name="titulo"
                className="form-input"
                placeholder="Ex: Visita técnica"
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="ag-tab-tipo">
                Tipo
              </label>
              <select id="ag-tab-tipo" name="tipo" className="form-input">
                {Object.entries(TIPO_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="form-label" htmlFor="ag-tab-inicio">
                Data e hora *
              </label>
              <input id="ag-tab-inicio" name="inicio" type="datetime-local" className="form-input" required />
            </div>
            <div>
              <label className="form-label" htmlFor="ag-tab-fim">
                Fim (opcional)
              </label>
              <input id="ag-tab-fim" name="fim" type="datetime-local" className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="ag-tab-localizacao">
              Localização (opcional)
            </label>
            <input
              id="ag-tab-localizacao"
              name="localizacao"
              className="form-input"
              placeholder="Endereço, obra, escritório ou link de referência"
              maxLength={500}
            />
          </div>
          <div>
            <label className="form-label" htmlFor="ag-tab-desc">
              Descrição (opcional)
            </label>
            <textarea
              id="ag-tab-desc"
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

      {itens.length === 0 ? (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">
              <CalendarIcon size={24} />
            </div>
            <div className="empty-state-title">Nenhum compromisso neste projeto</div>
            <p className="empty-state-sub">
              Crie um compromisso contextual para esta oportunidade ou obra.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {itens.map((item) => {
            const atrasado = isAtrasado(item.inicio, item.status);
            const descTruncada = item.descricao
              ? item.descricao.length > 120
                ? item.descricao.slice(0, 120) + "..."
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
                  {atrasado && <span className="badge badge-overdue">Atrasado</span>}
                </div>

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

                <div
                  style={{
                    fontSize: 13,
                    color: atrasado ? "var(--clr-danger)" : "var(--clr-text-secondary)",
                    marginBottom: descTruncada || item.localizacao ? 6 : 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <CalendarIcon size={13} />
                  {formatDateTimeBR(item.inicio)}
                  {item.fim ? ` - ${formatDateTimeBR(item.fim)}` : ""}
                </div>

                {item.localizacao && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      color: "var(--clr-text-secondary)",
                      marginBottom: descTruncada ? 6 : 0,
                    }}
                  >
                    <MapPinIcon size={13} />
                    {item.localizacao}
                  </div>
                )}

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

                <div
                  style={{
                    fontSize: 11,
                    color: "var(--clr-text-muted)",
                    marginBottom: item.status === "agendado" ? 10 : 0,
                  }}
                >
                  Origem: {ORIGEM_LABEL[item.origem ?? "manual"] ?? item.origem}
                </div>

                {item.status === "agendado" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <form action={marcarAgendaItemRealizadoAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="projetoId" value={projetoId} />
                      <button type="submit" className="btn btn-sm btn-secondary">
                        Marcar realizado
                      </button>
                    </form>
                    <form action={cancelarAgendaItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="projetoId" value={projetoId} />
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
