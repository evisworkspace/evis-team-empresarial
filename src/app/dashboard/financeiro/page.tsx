import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listLancamentosByEmpresa, sumLancamentosByEmpresa } from "@/data/financeiro";
import { listCategoriasByEmpresa } from "@/data/categoriaFinanceira";
import { FinanceIcon, ArrowRightIcon, CalendarIcon } from "@/components/Icons";
import { marcarLancamentoPago } from "@/actions/financeiro";

export const metadata: Metadata = { title: "Financeiro" };

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function tipoLabel(tipo: string) {
  return tipo === "entrada" ? "Entrada" : "Saída";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    previsto: "Previsto",
    pago: "Pago",
    recebido: "Recebido",
    cancelado: "Cancelado",
  };
  return map[status] ?? status;
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; categoriaId?: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { tipo: tipoFilter, categoriaId } = await searchParams;

  const [lancamentos, totais, categorias] = await Promise.all([
    listLancamentosByEmpresa(empresaId, { tipo: tipoFilter, categoriaId }),
    sumLancamentosByEmpresa(empresaId),
    listCategoriasByEmpresa(empresaId, { take: 100 }),
  ]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Financeiro</h1>
            <p className="page-subtitle">Visão consolidada de todos os lançamentos</p>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ cursor: "default" }}>
          <div className="stat-card__icon-wrap icon-green">
            <FinanceIcon size={18} />
          </div>
          <div className="stat-card__value" style={{ color: "var(--clr-success)" }}>
            {formatCurrency(totais.totalEntrada)}
          </div>
          <div className="stat-card__label">Total de entradas</div>
        </div>

        <div className="stat-card" style={{ cursor: "default" }}>
          <div className="stat-card__icon-wrap icon-orange">
            <FinanceIcon size={18} />
          </div>
          <div className="stat-card__value" style={{ color: "var(--clr-danger)" }}>
            {formatCurrency(totais.totalSaida)}
          </div>
          <div className="stat-card__label">Total de saídas</div>
        </div>

        <div className="stat-card" style={{ cursor: "default" }}>
          <div
            className="stat-card__icon-wrap"
            style={{ background: totais.saldo >= 0 ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)" }}
          >
            <FinanceIcon size={18} />
          </div>
          <div
            className="stat-card__value"
            style={{ color: totais.saldo >= 0 ? "var(--clr-success)" : "var(--clr-danger)" }}
          >
            {formatCurrency(totais.saldo)}
          </div>
          <div className="stat-card__label">Saldo geral</div>
        </div>
      </div>

      <form method="GET" action="/dashboard/financeiro" style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <select name="tipo" className="form-input form-select" defaultValue={tipoFilter ?? ""} style={{ width: 150 }}>
          <option value="">Todos os tipos</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>
        <select name="categoriaId" className="form-input form-select" defaultValue={categoriaId ?? ""} style={{ minWidth: 220 }}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary btn-sm">
          Aplicar
        </button>
        {(tipoFilter || categoriaId) && (
          <Link href="/dashboard/financeiro" className="btn btn-secondary btn-sm">
            Limpar
          </Link>
        )}
      </form>

      {/* Lista */}
      {lancamentos.length === 0 ? (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FinanceIcon size={24} />
            </div>
            <div className="empty-state-title">Nenhum lançamento encontrado</div>
            <p className="empty-state-sub">
              Lançamentos são registrados dentro de cada obra na Central da Obra.
            </p>
            <Link href="/dashboard/projetos?stage=obra" className="btn btn-primary" style={{ marginTop: 8 }}>
              <ArrowRightIcon size={14} />
              Ver obras
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="evis-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Obra</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((l) => (
                  <tr key={l.id}>
                    <td style={{ color: "var(--clr-text)", fontSize: 13 }}>
                      {l.descricao ?? "—"}
                    </td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {l.projeto ? (
                        <Link
                          href={`/dashboard/projetos/${l.projeto.id}`}
                          style={{ color: "var(--clr-primary)", fontWeight: 500 }}
                        >
                          {l.projeto.titulo}
                        </Link>
                      ) : "—"}
                    </td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {l.categoriaFinanceira?.nome ?? "—"}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={
                          l.tipo === "entrada"
                            ? { background: "rgba(34,197,94,.12)", color: "#166534", border: "1px solid rgba(34,197,94,.3)" }
                            : { background: "rgba(239,68,68,.08)", color: "#991b1b", border: "1px solid rgba(239,68,68,.2)" }
                        }
                      >
                        {tipoLabel(l.tipo)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13, color: l.tipo === "entrada" ? "var(--clr-success)" : "var(--clr-danger)" }}>
                      {l.tipo === "saida" ? "− " : "+ "}
                      {formatCurrency(Number(l.valor))}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--clr-text-muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <CalendarIcon size={12} />
                        {formatDate(l.dataVencimento)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${l.status}`}>{statusLabel(l.status)}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {l.status === "previsto" && l.projeto && (
                          <form action={marcarLancamentoPago}>
                            <input type="hidden" name="lancamentoId" value={l.id} />
                            <input type="hidden" name="projetoId" value={l.projeto.id} />
                            <input type="hidden" name="tipo" value={l.tipo} />
                            <button type="submit" className="btn btn-sm btn-secondary" style={{ fontSize: 11 }}>
                              {l.tipo === "entrada" ? "Recebido" : "Pago"}
                            </button>
                          </form>
                        )}
                        {l.projeto && (
                          <Link href={`/dashboard/projetos/${l.projeto.id}`} className="btn btn-sm btn-secondary">
                            Obra <ArrowRightIcon size={12} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
