import type React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listProjetosByEmpresaWithCliente, countProjetosByEmpresa, sumValorEstimadoByEmpresa } from "@/data/projeto";
import { BuildingIcon, PlusIcon, ChevronRightIcon } from "@/components/Icons";
import OportunidadesKanban from "@/components/OportunidadesKanban";
import ProjetosKanban from "@/components/ProjetosKanban";
import AcoesDropdown from "@/components/AcoesDropdown";
import { GerenciarStatusBotao } from "@/components/GerenciarStatusPanel";
import { getOrSeedStatuses } from "@/data/statusProjeto";
import StatusDropdown from "@/components/StatusDropdown";
import ProjetoAcoes from "@/components/ProjetoAcoes";
import { getStatusConfig } from "@/lib/status";
import FiltrarStatusPanel from "@/components/FiltrarStatusPanel";

export const metadata: Metadata = { title: "Projetos e Obras" };


function prioridadeStyle(p: string | null): React.CSSProperties {
  if (!p) return {};
  const map: Record<string, React.CSSProperties> = {
    urgente: { color: "#991b1b", fontWeight: 700 },
    alta:    { color: "#9a3412", fontWeight: 600 },
    media:   { color: "#854d0e" },
    baixa:   { color: "#475569" },
  };
  return map[p] ?? {};
}

function prioridadeLabel(p: string | null) {
  if (!p) return "—";
  const map: Record<string, string> = { urgente: "Urgente", alta: "Alta", media: "Média", baixa: "Baixa" };
  return map[p] ?? p;
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatMoney(v: number | null | undefined) {
  if (v == null || v === 0) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(v));
}

function formatArea(v: number | null | undefined) {
  if (v == null) return "—";
  return `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²`;
}

const TH: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--clr-text-muted)",
  padding: "10px 16px",
  textAlign: "left",
  whiteSpace: "nowrap",
  borderBottom: "1px solid var(--clr-border)",
  background: "var(--clr-surface)",
};

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; incluirPerdidas?: string; showFechadas?: string; q?: string; view?: string; statusFiltro?: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { stage: stageFilter, incluirPerdidas, showFechadas: showFechadasParam, q, view, statusFiltro } = await searchParams;
  const busca = q?.trim() || undefined;
  const viewMode = view === "lista" ? "lista" : (stageFilter === "oportunidade" || stageFilter === "obra") ? "kanban" : "lista";
  const statusFiltroAtivos = statusFiltro ? statusFiltro.split(",").filter(Boolean) : [];

  const showPerdidas = incluirPerdidas === "1";
  const excludePerdidas =
    stageFilter === "oportunidade" && !showPerdidas ? "perdido" : undefined;

  // Pre-fetch obras statuses to derive fechadas slugs (needed before Promise.all)
  const preObraStatuses =
    stageFilter === "obra" || !stageFilter
      ? await getOrSeedStatuses(empresaId, "obra")
      : [];
  const obrasFechadasSlugs = preObraStatuses.filter((s) => !s.ativo).map((s) => s.slug);
  const showFechadas = showFechadasParam === "1";
  const excludeObrasFechadas =
    stageFilter === "obra" && !showFechadas && obrasFechadasSlugs.length > 0
      ? obrasFechadasSlugs
      : undefined;

  const isOportunidadeKanban = stageFilter === "oportunidade" && viewMode === "kanban";
  const isObraKanban = stageFilter === "obra" && viewMode === "kanban";
  const isKanban = isOportunidadeKanban || isObraKanban;

  const kanbanStage = isOportunidadeKanban ? "oportunidade" : isObraKanban ? "obra" : undefined;

  const filtroStage = (stageFilter === "oportunidade" || stageFilter === "obra") ? stageFilter : undefined;

  const [projetos, projetosKanban, statusKanban, todasColunasFiltro, obrasAtivasCount, obrasFechadasCount, opCount, opPerdidasCount, totalValor] = await Promise.all([
    listProjetosByEmpresaWithCliente(empresaId, {
      stage: stageFilter,
      excludeStatusInterno: excludePerdidas,
      excludeStatusInternoList: excludeObrasFechadas,
      statusInternoIn: statusFiltroAtivos.length > 0 ? statusFiltroAtivos : undefined,
      q: busca,
    }),
    isOportunidadeKanban
      ? listProjetosByEmpresaWithCliente(empresaId, { stage: "oportunidade", take: 200 })
      : isObraKanban
      ? listProjetosByEmpresaWithCliente(empresaId, { stage: "obra", take: 200 })
      : Promise.resolve([]),
    isObraKanban ? Promise.resolve(preObraStatuses) : (kanbanStage ? getOrSeedStatuses(empresaId, kanbanStage) : Promise.resolve([])),
    stageFilter === "obra" ? Promise.resolve(preObraStatuses) : (filtroStage ? getOrSeedStatuses(empresaId, filtroStage) : Promise.resolve([])),
    countProjetosByEmpresa(empresaId, "obra", obrasFechadasSlugs.length > 0 ? { excludeStatusInternoList: obrasFechadasSlugs } : undefined),
    obrasFechadasSlugs.length > 0
      ? countProjetosByEmpresa(empresaId, "obra", { statusInternoIn: obrasFechadasSlugs })
      : Promise.resolve(0),
    countProjetosByEmpresa(empresaId, "oportunidade", { excludeStatusInterno: "perdido" }),
    countProjetosByEmpresa(empresaId, "oportunidade"),
    stageFilter === "oportunidade" && !showPerdidas
      ? sumValorEstimadoByEmpresa(empresaId, { excludeStatusInterno: "perdido" })
      : Promise.resolve(0),
  ]);

  const isOportunidadeView = stageFilter === "oportunidade";
  const isObraView = stageFilter === "obra";

  function buildBaseUrl(overrides: Record<string, string | undefined> = {}) {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      stage: stageFilter,
      incluirPerdidas: showPerdidas ? "1" : undefined,
      showFechadas: showFechadas ? "1" : undefined,
      view: viewMode === "kanban" ? "kanban" : undefined,
      q: busca,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined) params.set(k, v);
    }
    const qs = params.toString();
    return `/dashboard/projetos${qs ? `?${qs}` : ""}`;
  }

  const baseUrlSemFiltro = buildBaseUrl({ statusFiltro: undefined });
  const baseUrlParaFiltroPanel = buildBaseUrl({ statusFiltro: undefined });

  function chipRemoveUrl(slug: string) {
    const remaining = statusFiltroAtivos.filter((s) => s !== slug);
    return buildBaseUrl({ statusFiltro: remaining.length > 0 ? remaining.join(",") : undefined });
  }

  const pageLabel = isObraView ? "Obras" : isOportunidadeView ? "Oportunidades" : "Projetos e Obras";
  const pageDesc = isObraView
    ? `${obrasAtivasCount} obra${obrasAtivasCount !== 1 ? "s" : ""} ativa${obrasAtivasCount !== 1 ? "s" : ""}`
    : isOportunidadeView
    ? `${opCount} oportunidade${opCount !== 1 ? "s" : ""} ativa${opCount !== 1 ? "s" : ""}`
    : `${obrasAtivasCount} obra${obrasAtivasCount !== 1 ? "s" : ""} · ${opCount} oportunidade${opCount !== 1 ? "s" : ""} ativa${opCount !== 1 ? "s" : ""}`;

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "var(--clr-primary)",
              marginBottom: 8,
            }}>
              <BuildingIcon size={13} />
              {pageLabel}
            </div>
            <h1 className="page-title">{pageLabel}</h1>
            <p className="page-subtitle">
              {pageDesc}
              {!stageFilter && opPerdidasCount - opCount > 0 && (
                <span style={{ color: "var(--clr-text-muted)" }}>
                  {" "}· {opPerdidasCount - opCount} perdida{opPerdidasCount - opCount !== 1 ? "s" : ""}
                </span>
              )}
              {isObraView && obrasFechadasCount > 0 && !showFechadas && (
                <span style={{ color: "var(--clr-text-muted)" }}>
                  {" "}· {obrasFechadasCount} fechada{obrasFechadasCount !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {isOportunidadeView && <AcoesDropdown />}
            {(isOportunidadeKanban || isObraKanban) && (
              <GerenciarStatusBotao statuses={statusKanban} stage={kanbanStage!} />
            )}
            {isOportunidadeView && !showPerdidas && totalValor > 0 && (
              <div style={{
                background: "var(--clr-surface)",
                border: "1px solid var(--clr-border)",
                borderRadius: "var(--r-lg)",
                padding: "10px 18px",
                textAlign: "right",
                boxShadow: "var(--shadow-xs)",
              }}>
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--clr-text-muted)",
                  marginBottom: 3,
                }}>
                  Valor estimado total
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--clr-success)", fontFamily: "var(--font-mono)" }}>
                  {formatMoney(totalValor)}
                </div>
              </div>
            )}
            <Link
              href={isObraView ? "/dashboard/projetos/novo?stage=obra" : "/dashboard/projetos/novo?stage=oportunidade"}
              className="btn btn-primary"
            >
              <PlusIcon size={16} />
              {isObraView ? "Nova obra" : "Nova oportunidade"}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Filtros + Busca ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>

        {/* Pill group de filtros */}
        <div style={{ display: "flex", gap: 3, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "var(--r-xl)", padding: 4 }}>
          {(
            [
              { href: "/dashboard/projetos", label: `Todos (${obrasAtivasCount + opCount})`, active: !stageFilter },
              { href: "/dashboard/projetos?stage=obra", label: `Obras (${obrasAtivasCount})`, active: isObraView && !showFechadas },
              { href: "/dashboard/projetos?stage=oportunidade", label: `CRM (${opCount})`, active: isOportunidadeView && !showPerdidas },
              ...(opPerdidasCount - opCount > 0
                ? [{
                    href: showPerdidas ? "/dashboard/projetos?stage=oportunidade" : "/dashboard/projetos?stage=oportunidade&incluirPerdidas=1",
                    label: `Perdidas (${opPerdidasCount - opCount})`,
                    active: showPerdidas,
                  }]
                : []),
              ...(obrasFechadasCount > 0
                ? [{
                    href: showFechadas ? "/dashboard/projetos?stage=obra" : "/dashboard/projetos?stage=obra&showFechadas=1",
                    label: `Fechadas (${obrasFechadasCount})`,
                    active: isObraView && showFechadas,
                  }]
                : []),
            ] as { href: string; label: string; active: boolean }[]
          ).map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--r-lg)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
                textDecoration: "none",
                transition: "all 0.12s",
                whiteSpace: "nowrap" as const,
                ...(tab.active
                  ? { background: "var(--clr-primary)", color: "#fff", boxShadow: "var(--shadow-xs)" }
                  : { color: "#6b7280" }),
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Toggle Lista / Quadro — oportunidades e obras */}
        {(isOportunidadeView || isObraView) && (
          <div style={{ display: "flex", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "var(--r-md)", padding: 3 }}>
            {([
              { href: `/dashboard/projetos?stage=${isObraView ? "obra" : "oportunidade"}&view=lista`, label: "Lista", mode: "lista" },
              { href: `/dashboard/projetos?stage=${isObraView ? "obra" : "oportunidade"}&view=kanban`, label: "Quadro", mode: "kanban" },
            ] as { href: string; label: string; mode: string }[]).map((t) => (
              <Link
                key={t.mode}
                href={t.href}
                style={{
                  padding: "5px 14px",
                  borderRadius: "var(--r-sm)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                  textDecoration: "none",
                  transition: "all 0.12s",
                  ...(viewMode === t.mode
                    ? { background: "#fff", color: "var(--clr-primary)", boxShadow: "var(--shadow-xs)" }
                    : { color: "#9ca3af" }),
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>
        )}

        {/* Botão de filtro por status — só quando há stage selecionado */}
        {filtroStage && todasColunasFiltro.length > 0 && (
          <FiltrarStatusPanel
            colunas={todasColunasFiltro}
            statusAtivos={statusFiltroAtivos}
            baseUrl={baseUrlParaFiltroPanel}
          />
        )}

        <form method="GET" action="/dashboard/projetos" style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {stageFilter && <input type="hidden" name="stage" value={stageFilter} />}
          {showPerdidas && <input type="hidden" name="incluirPerdidas" value="1" />}
          {showFechadas && <input type="hidden" name="showFechadas" value="1" />}
          {viewMode === "kanban" && <input type="hidden" name="view" value="kanban" />}
          <input
            name="q"
            type="search"
            className="form-input"
            placeholder="Buscar por título..."
            defaultValue={busca ?? ""}
            style={{ width: 220, fontSize: 13 }}
          />
          <button type="submit" className="btn btn-secondary btn-sm">Buscar</button>
          {busca && (
            <Link
              href={stageFilter ? `/dashboard/projetos?stage=${stageFilter}${showPerdidas ? "&incluirPerdidas=1" : ""}${viewMode === "kanban" ? "&view=kanban" : ""}` : "/dashboard/projetos"}
              className="btn btn-secondary btn-sm"
            >
              Limpar
            </Link>
          )}
        </form>
      </div>

      {/* ── Chips de filtro ativo ── */}
      {statusFiltroAtivos.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {statusFiltroAtivos.map((slug) => {
            const col = todasColunasFiltro.find((c) => c.slug === slug);
            return (
              <span key={slug} style={{ background: "var(--clr-bg-subtle)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-xl)", padding: "3px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                {col?.label ?? slug}
                <Link href={chipRemoveUrl(slug)} style={{ color: "#9ca3af", textDecoration: "none" }}>×</Link>
              </span>
            );
          })}
          <Link href={baseUrlSemFiltro} style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>Limpar filtros</Link>
        </div>
      )}

      {/* ── Kanban ── */}
      {isOportunidadeKanban && <OportunidadesKanban projetos={projetosKanban} colunas={statusKanban} />}
      {isObraKanban && <ProjetosKanban projetos={projetosKanban} colunas={statusKanban} />}

      {/* ── Lista ── */}
      {!isKanban && (projetos.length === 0 ? (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon"><BuildingIcon size={24} /></div>
            <div className="empty-state-title">
              {isObraView ? "Nenhuma obra criada" : isOportunidadeView ? "Nenhuma oportunidade" : "Nenhum projeto criado"}
            </div>
            <p className="empty-state-sub">Crie seu primeiro registro para começar a operar no EVIS.</p>
            <Link
              href={isObraView ? "/dashboard/projetos/novo?stage=obra" : "/dashboard/projetos/novo?stage=oportunidade"}
              className="btn btn-primary"
              style={{ marginTop: 8 }}
            >
              <PlusIcon size={15} />
              {isObraView ? "Nova obra" : "Nova oportunidade"}
            </Link>
          </div>
        </div>
      ) : isOportunidadeView ? (
        /* ── Tabela enriquecida de oportunidades ── */
        <div className="card">
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--clr-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--clr-text-muted)" }}>
              {projetos.length} oportunidade{projetos.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 48 }}>#</th>
                  <th style={TH}>Oportunidade</th>
                  <th style={TH}>Cliente</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Prioridade</th>
                  <th style={TH}>Tipo</th>
                  <th style={{ ...TH, textAlign: "right" }}>Valor est.</th>
                  <th style={{ ...TH, textAlign: "right" }}>Metragem</th>
                  <th style={TH}>Origem</th>
                  <th style={TH}>Criada em</th>
                  <th style={TH}></th>
                </tr>
              </thead>
              <tbody>
                {projetos.map((p, rowIdx) => {
                  const pr = p as typeof p & { prioridade?: string | null; tipoObra?: string | null; valorEstimado?: number | null; metragemEstimada?: number | null };
                  return (
                    <tr key={p.id} style={{ cursor: "pointer" }} className="evis-table-row">
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle", width: 64 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--clr-text-muted)", fontWeight: 600 }}>
                          {p.codigoSequencial ?? `#${String(rowIdx + 1).padStart(3, "0")}`}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle" }}>
                        <Link href={`/dashboard/projetos/${p.id}`} style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--clr-text)", fontSize: 14 }}>{p.titulo}</div>
                            {pr.tipoObra && (
                              <div style={{ fontSize: 11, color: "var(--clr-text-muted)", marginTop: 2 }}>{pr.tipoObra}</div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle", color: "var(--clr-text-secondary)", fontSize: 13 }}>
                        {p.cliente?.nome ?? "—"}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle" }}>
                        <StatusDropdown projetoId={p.id} stage={p.stage} statusAtual={p.statusInterno} />
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle", fontFamily: "var(--font-mono)", fontSize: 11, ...prioridadeStyle(pr.prioridade ?? null) }}>
                        {prioridadeLabel(pr.prioridade ?? null)}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle", fontSize: 12, color: "var(--clr-text-muted)" }}>
                        {pr.tipoObra ?? "—"}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--clr-text)" }}>
                        {formatMoney(pr.valorEstimado)}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--clr-text-secondary)" }}>
                        {formatArea(pr.metragemEstimada)}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle", fontSize: 12, color: "var(--clr-text-muted)" }}>
                        {p.origem ?? "—"}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--clr-text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(p.createdAt)}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Link href={`/dashboard/projetos/${p.id}`} style={{ display: "flex", alignItems: "center", color: "var(--clr-text-muted)", transition: "color 0.12s" }}>
                            <ChevronRightIcon size={16} />
                          </Link>
                          <ProjetoAcoes projetoId={p.id} stage={p.stage} titulo={p.titulo} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Tabela padrão (obras ou todos) ── */
        <div className="card">
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--clr-border)", display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--clr-text-muted)" }}>
              {projetos.length} resultado{projetos.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Título</th>
                  <th style={TH}>Cliente</th>
                  <th style={TH}>Tipo</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Início estimado</th>
                  <th style={TH}></th>
                </tr>
              </thead>
              <tbody>
                {projetos.map((p) => (
                  <tr key={p.id} style={{ cursor: "pointer" }} className="evis-table-row">
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle" }}>
                      <Link href={`/dashboard/projetos/${p.id}`} style={{ textDecoration: "none" }}>
                        <div style={{ fontWeight: 600, color: "var(--clr-text)", fontSize: 14 }}>{p.titulo}</div>
                        {p.codigoSequencial && (
                          <div style={{ fontSize: 11, color: "var(--clr-primary)", fontFamily: "var(--font-mono)", fontWeight: 600, marginTop: 2 }}>{p.codigoSequencial}</div>
                        )}
                        {p.numeroObra && (
                          <div style={{ fontSize: 11, color: "var(--clr-text-muted)", marginTop: 2 }}>Nr. {p.numeroObra}</div>
                        )}
                      </Link>
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle", color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {p.cliente?.nome ?? "—"}
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle" }}>
                      <span className={p.stage === "obra" ? "badge badge-obra" : "badge badge-oportunidade"}>
                        {p.stage === "obra" ? "Obra" : "Oportunidade"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle" }}>
                      <StatusDropdown projetoId={p.id} stage={p.stage} statusAtual={p.statusInterno} />
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle", color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {formatDate(p.dataInicioEstimada)}
                    </td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--clr-border-light)", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Link href={`/dashboard/projetos/${p.id}`} style={{ display: "flex", alignItems: "center", color: "var(--clr-text-muted)" }}>
                          <ChevronRightIcon size={16} />
                        </Link>
                        <ProjetoAcoes projetoId={p.id} stage={p.stage} titulo={p.titulo} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
