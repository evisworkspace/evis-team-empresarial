import { Fragment } from "react";
import type React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getProjetoWithDetails } from "@/data/projeto";
import { sumLancamentosByProjeto } from "@/data/financeiro";
import { listCategoriasByEmpresa } from "@/data/categoriaFinanceira";
import { listCentrosCustoByEmpresa } from "@/data/centroDeCusto";
import { listFornecedoresByEmpresa } from "@/data/fornecedor";
import { criarTarefa, toggleTarefaStatus, editarTarefa, deletarTarefa } from "@/actions/tarefa";
import { criarLancamento, marcarLancamentoPago } from "@/actions/financeiro";
import { atualizarStatusFunil, atualizarStatusObra, criarAtividadeProjeto, editarAtividade, deletarAtividade } from "@/actions/projeto";
import { criarAnotacao, excluirAnotacao } from "@/actions/anotacao";
import { listItensOrcamentoByProjeto } from "@/data/projetoItemOrcamento";
import { criarGrupoOrcamento, criarItemOrcamento, editarItemOrcamento, excluirItemOrcamento } from "@/actions/projetoItemOrcamento";
import { listItensByEmpresa } from "@/data/itemBiblioteca";
import { getOttoSessaoAtiva } from "@/data/otto";
import { OrcamentoTab } from "@/components/orcamento/OrcamentoTab";
import { listMedicoesByProjeto } from "@/data/medicao";
import { PlanejamentoTab } from "@/components/obra/PlanejamentoTab";
import { MedicoesTab } from "@/components/obra/MedicoesTab";
import { FisicoFinanceiroTab } from "@/components/obra/FisicoFinanceiroTab";
import { CurvaSTab } from "@/components/obra/CurvaSTab";
import { DiarioTab } from "@/components/obra/DiarioTab";
import RdiTab from "@/components/obra/RdiTab";
import { AgendaTab } from "@/components/agenda/AgendaTab";
import { salvarPlanejamentoItem } from "@/actions/planejamento";
import { criarDiario, aprovarItemHITL, rejeitarItemHITL } from "@/actions/diarioObra";
import { criarMedicao } from "@/actions/medicao";
import {
  criarAgendaItemAction,
  marcarAgendaItemRealizadoAction,
  cancelarAgendaItemAction,
} from "@/actions/agenda";
import { LancamentoFinanceiroForm } from "@/components/financeiro/LancamentoFinanceiroForm";
import {
  BuildingIcon,
  CalendarIcon,
  ClockIcon,
  FinanceIcon,
  TasksIcon,
  AgentsIcon,
  HistoryIcon,
  ActivityIcon,
  TruckIcon,
  PlusIcon,
  ArrowRightIcon,
  AlertIcon,
  PhoneIcon,
  MapPinIcon,
  UsersIcon,
  EditIcon,
} from "@/components/Icons";

export const metadata: Metadata = { title: "Projeto" };

const FUNIL = [
  { value: "fila_espera", label: "Fila Espera" },
  { value: "novo", label: "Agendar Visita" },
  { value: "orcamento", label: "Montando Orçamento" },
  { value: "proposta_enviada", label: "Montando Proposta" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "ganho", label: "Ganho ✓" },
];

function getFunilIndex(status: string) {
  if (status === "aberta") return 0;
  const idx = FUNIL.findIndex((s) => s.value === status);
  return idx === -1 ? 0 : idx;
}

function oportunidadeStatusLabel(status: string) {
  const map: Record<string, string> = {
    fila_espera: "Fila Espera", novo: "Agendar Visita", aberta: "Agendar Visita",
    orcamento: "Montando Orçamento", proposta_enviada: "Montando Proposta",
    em_negociacao: "Em negociação", ganho: "Ganho", perdido: "Perdida",
  };
  return map[status] ?? status;
}

function obraStatusLabel(status: string) {
  const map: Record<string, string> = {
    em_andamento: "Em andamento", abertura: "Abertura", planejamento: "Planejamento",
    pausada: "Pausada", concluida: "Concluída", entregue: "Entregue", encerrada: "Encerrada",
  };
  return map[status] ?? status;
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatMoney(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(v));
}

function formatArea(v: number | null | undefined) {
  if (v == null) return "—";
  return `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²`;
}

function prioridadeLabel(p: string | null | undefined) {
  if (!p) return "—";
  const map: Record<string, string> = { urgente: "Urgente", alta: "Alta", media: "Média", baixa: "Baixa" };
  return map[p] ?? p;
}

function prioridadeStyle(p: string | null | undefined): React.CSSProperties {
  if (!p) return { color: "var(--clr-text-muted)" };
  const map: Record<string, React.CSSProperties> = {
    urgente: { color: "#991b1b", fontWeight: 700 },
    alta:    { color: "#9a3412", fontWeight: 600 },
    media:   { color: "#854d0e" },
    baixa:   { color: "#475569" },
  };
  return map[p] ?? {};
}

function tipoObraLabel(t: string | null | undefined) {
  if (!t) return "—";
  const map: Record<string, string> = {
    residencial: "Residencial", comercial: "Comercial",
    industrial: "Industrial", reforma: "Reforma", outro: "Outro",
  };
  return map[t] ?? t;
}

function atividadeTipoLabel(t: string) {
  const map: Record<string, string> = {
    ligacao: "Ligação", visita: "Visita", email: "E-mail",
    reuniao: "Reunião", nota: "Nota", outro: "Outro",
  };
  return map[t] ?? t;
}

function DetailItem({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div style={{
      border: "1px solid var(--clr-border)",
      background: "var(--clr-surface-hover)",
      borderRadius: "var(--r-md)",
      padding: "14px 16px",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.12em",
        color: "var(--clr-text-muted)",
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: highlight ? "var(--clr-success)" : "var(--clr-text)",
        fontFamily: highlight ? "var(--font-mono)" : undefined,
      }}>
        {value || "—"}
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  fila_espera: "Fila Espera", novo: "Agendar Visita", orcamento: "Montando Orçamento",
  proposta_enviada: "Montando Proposta", em_negociacao: "Em negociação",
  ganho: "Ganho", perdido: "Perdida", abertura: "Abertura", planejamento: "Planejamento",
  em_andamento: "Em andamento", pausada: "Pausada", concluida: "Concluída",
  entregue: "Entregue", encerrada: "Encerrada",
};

function eventoLabel(tipo: string, conteudo?: unknown) {
  const data = conteudo && typeof conteudo === "object" ? (conteudo as Record<string, string>) : {};
  const map: Record<string, string> = {
    criacao: "Criado",
    edicao: "Editado",
    alteracao_status: data.novoStatus ? `→ ${STATUS_LABELS[data.novoStatus] ?? data.novoStatus}` : "Status alterado",
    conversao_stage: "Convertido em obra",
    alteracao_financeiro: data.tipo && data.valor ? `Lançamento ${data.tipo} — R$ ${Number(data.valor).toLocaleString("pt-BR")}` : "Lançamento financeiro",
    validacao_ia: "Validação IA",
    rejeicao_ia: "Rejeição IA",
  };
  return map[tipo] ?? tipo;
}

type ProjetoDetalhes = NonNullable<Awaited<ReturnType<typeof getProjetoWithDetails>>>;
type Financeiro = { totalEntrada: number; totalSaida: number; saldo: number };
type OrcamentoProps = React.ComponentProps<typeof OrcamentoTab>;
type FinanceiroFormLists = {
  categorias: { id: string; nome: string; tipo: string }[];
  centrosCusto: { id: string; nome: string }[];
  fornecedores: { id: string; nome: string }[];
};

// Função utilitária compartilhada entre as duas views
function isOverdue(t: ProjetoDetalhes["tarefas"][0], now: Date) {
  return t.dataPrevista != null && new Date(t.dataPrevista) < now && t.status !== "concluida" && t.status !== "cancelada";
}

// ─── Visão de Oportunidade ────────────────────────────────────────────────────

function OportunidadeView({
  projeto,
  empresaId,
  financeiro,
  orcamento,
  financeiroFormLists,
  openRdi,
  diariosObra,
}: {
  projeto: ProjetoDetalhes;
  empresaId: string;
  financeiro: Financeiro;
  orcamento: OrcamentoProps;
  financeiroFormLists: FinanceiroFormLists;
  openRdi: boolean;
  diariosObra: React.ComponentProps<typeof DiarioTab>["diarios"];
}) {
  const isPerdida = projeto.statusInterno === "perdido";
  const isGanho = projeto.statusInterno === "ganho";
  const currentIdx = getFunilIndex(projeto.statusInterno);
  const now = new Date();
  const tarefasConcluidas = projeto.tarefas.filter((t) => t.status === "concluida").length;

  return (
    <div>
      <Link href="/dashboard/projetos?stage=oportunidade" className="back-link">
        ← Oportunidades
      </Link>

      {/* Header */}
      <div className="obra-header">
        <div className="obra-title-block">
          <div className="obra-meta">
            <span className="badge badge-oportunidade">Oportunidade</span>
            {projeto.codigoSequencial && (
              <span className="tipo-tag" data-lia-codigo={projeto.codigoSequencial} style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>{projeto.codigoSequencial}</span>
            )}
            {isPerdida && (
              <span className="badge" style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
                Perdida
              </span>
            )}
          </div>
          <h1 className="obra-title">{projeto.titulo}</h1>
          <div className="obra-meta">
            {projeto.cliente && (
              <span className="obra-meta-item">
                <UsersIcon size={13} />{" "}
                <Link href={`/dashboard/clientes/${projeto.cliente.id}`} style={{ color: "var(--clr-primary)", fontWeight: 500 }}>
                  {projeto.cliente.nome}
                </Link>
              </span>
            )}
            {projeto.origem && <span className="obra-meta-item">· {projeto.origem}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/dashboard/projetos/${projeto.id}/editar`} className="btn btn-secondary btn-sm">
            <EditIcon size={13} /> Editar
          </Link>
          <Link href="/dashboard/projetos?stage=oportunidade" className="btn btn-secondary btn-sm">
            ← Voltar
          </Link>
        </div>
      </div>

      {/* Funil bar */}
      {!isPerdida && (
        <div className="funil-bar">
          <form action={atualizarStatusFunil} style={{ display: "contents" }}>
            <input type="hidden" name="projetoId" value={projeto.id} />
            {FUNIL.map((step, idx) => {
              const isCurrent = idx === currentIdx;
              const isPast = idx < currentIdx;
              return (
                <Fragment key={step.value}>
                  {idx > 0 && <div className={`funil-connector ${isPast || isCurrent ? "funil-connector--done" : ""}`} />}
                  <button
                    type="submit"
                    name="statusInterno"
                    value={step.value}
                    disabled={isCurrent}
                    className={`funil-step ${isCurrent ? "funil-step--active" : ""} ${isPast ? "funil-step--past" : ""}`}
                  >
                    <span className="funil-step-dot" />
                    {step.label}
                  </button>
                </Fragment>
              );
            })}
          </form>
        </div>
      )}

      {/* CTA de conversão — Lote 10C: vai para página de confirmação com dados do cliente */}
      {!isPerdida && (
        isGanho ? (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "var(--r-lg)",
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--clr-success)", marginBottom: 4 }}>
                Oportunidade ganha
              </div>
              <div style={{ fontSize: 13, color: "var(--clr-text-secondary)" }}>
                Complete os dados do cliente e confirme a conversão em obra.
              </div>
            </div>
            <Link
              href={`/dashboard/projetos/${projeto.id}/confirmar-conversao`}
              className="btn btn-primary"
              style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}
            >
              Confirmar dados e converter
              <ArrowRightIcon size={15} />
            </Link>
          </div>
        ) : (
          <div className="callout callout--info" style={{ marginBottom: 24 }}>
            Avance o funil até <strong>Ganho</strong> para converter esta oportunidade em obra.
          </div>
        )
      )}

      {/* Tabs da oportunidade */}
      <div className="obra-tabs">
        <input type="radio" name="op-tab" id="op-tab-geral" className="obra-tab-radio" defaultChecked={!openRdi} />
        <input type="radio" name="op-tab" id="op-tab-rdi" className="obra-tab-radio" defaultChecked={openRdi} />
        <input type="radio" name="op-tab" id="op-tab-cliente" className="obra-tab-radio" />
        <input type="radio" name="op-tab" id="op-tab-atividades" className="obra-tab-radio" />
        <input type="radio" name="op-tab" id="op-tab-tarefas" className="obra-tab-radio" />
        <input type="radio" name="op-tab" id="op-tab-financeiro" className="obra-tab-radio" />
        <input type="radio" name="op-tab" id="op-tab-historico" className="obra-tab-radio" />
        <input type="radio" name="op-tab" id="op-tab-orcamento" className="obra-tab-radio" />
        <input type="radio" name="op-tab" id="op-tab-propostas" className="obra-tab-radio" />
        <input type="radio" name="op-tab" id="op-tab-anotacoes" className="obra-tab-radio" />
        <input type="radio" name="op-tab" id="op-tab-diario" className="obra-tab-radio" />
        <input type="radio" name="op-tab" id="op-tab-agenda" className="obra-tab-radio" />
        <input type="radio" name="op-tab" id="op-tab-agentes" className="obra-tab-radio" />

        <div className="obra-tabs-nav">
          <label htmlFor="op-tab-geral" className="obra-tab-label">Geral</label>
          <label htmlFor="op-tab-rdi" className="obra-tab-label">RDI</label>
          <label htmlFor="op-tab-cliente" className="obra-tab-label">Cliente</label>
          <label htmlFor="op-tab-atividades" className="obra-tab-label">
            Atividades{projeto.atividades.length > 0 ? ` (${projeto.atividades.length})` : ""}
          </label>
          <label htmlFor="op-tab-tarefas" className="obra-tab-label">
            Tarefas{projeto.tarefas.length > 0 ? ` (${projeto.tarefas.length})` : ""}
          </label>
          <label htmlFor="op-tab-financeiro" className="obra-tab-label">Financeiro</label>
          <label htmlFor="op-tab-historico" className="obra-tab-label">Histórico</label>
          <label htmlFor="op-tab-orcamento" className="obra-tab-label">Orçamento</label>
          <label htmlFor="op-tab-propostas" className="obra-tab-label">Propostas</label>
          <label htmlFor="op-tab-anotacoes" className="obra-tab-label">
            Anotações{projeto.anotacoes.length > 0 ? ` (${projeto.anotacoes.length})` : ""}
          </label>
          <label htmlFor="op-tab-diario" className="obra-tab-label">Diário</label>
          <label htmlFor="op-tab-agenda" className="obra-tab-label">Agenda</label>
          <label htmlFor="op-tab-agentes" className="obra-tab-label">Agentes</label>
        </div>

        <div className="obra-tabs-panels">
          {/* ── Geral ─────────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-geral">
            <div className="obra-grid">
              {projeto.descricao && (
                <div className="obra-card obra-card--full">
                  <div className="obra-card-header">
                    <span className="obra-card-label">Narrativa / Briefing inicial</span>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--clr-text-secondary)", lineHeight: 1.8, margin: 0 }}>
                    {projeto.descricao}
                  </p>
                </div>
              )}

              {/* Grid de detalhes — padrão DetailItem do Antigo Testamento */}
              <div className="obra-card obra-card--full">
                <div className="obra-card-header">
                  <span className="obra-card-label"><BuildingIcon size={13} /> Detalhes gerais</span>
                  <Link href={`/dashboard/projetos/${projeto.id}/editar`} style={{ fontSize: 12, color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                    <EditIcon size={12} /> Editar
                  </Link>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  <DetailItem label="Status" value={oportunidadeStatusLabel(projeto.statusInterno)} />
                  <DetailItem label="Tipo de obra" value={tipoObraLabel(projeto.tipoObra)} />
                  <DetailItem label="Prioridade" value={
                    <span style={prioridadeStyle(projeto.prioridade)}>{prioridadeLabel(projeto.prioridade)}</span>
                  } />
                  <DetailItem label="Origem" value={projeto.origem ?? "—"} />
                  <DetailItem label="Início estimado" value={formatDate(projeto.dataInicioEstimada)} />
                  <DetailItem label="Criado em" value={formatDate(projeto.createdAt)} />
                  <DetailItem label="Valor estimado" value={formatMoney(projeto.valorEstimado != null ? Number(projeto.valorEstimado) : null)} highlight />
                  <DetailItem label="Metragem" value={formatArea(projeto.metragemEstimada != null ? Number(projeto.metragemEstimada) : null)} />
                  {projeto.dataDeGanho && (
                    <DetailItem label="Data de ganho" value={formatDate(projeto.dataDeGanho)} />
                  )}
                  {(projeto.logradouroObra || projeto.cidadeObra || projeto.enderecoObra) && (
                    <DetailItem label="Endereço da obra" value={
                      <span style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                        <MapPinIcon size={13} />
                        {projeto.logradouroObra
                          ? [
                              projeto.logradouroObra,
                              projeto.numeroEnderecoObra,
                              projeto.complementoObra,
                              projeto.bairroObra,
                              projeto.cidadeObra,
                              projeto.estadoObra,
                            ].filter(Boolean).join(", ")
                          : projeto.enderecoObra}
                      </span>
                    } />
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "flex-end", padding: "4px 8px" }}>
                {!isPerdida ? (
                  <>
                    <form action={atualizarStatusFunil}>
                      <input type="hidden" name="projetoId" value={projeto.id} />
                      <button type="submit" name="statusInterno" value="perdido" className="btn btn-sm" style={{ background: "transparent", border: "none", color: "var(--clr-text-muted)" }}>
                        Arquivar oportunidade
                      </button>
                    </form>
                    {!isGanho && (
                      <form action={atualizarStatusFunil}>
                        <input type="hidden" name="projetoId" value={projeto.id} />
                        <button type="submit" name="statusInterno" value="ganho" className="btn btn-secondary btn-sm" style={{ borderColor: "#86efac", color: "#166534", background: "#f0fdf4" }}>
                          Aprovar oportunidade ✓
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  <form action={atualizarStatusFunil}>
                    <input type="hidden" name="projetoId" value={projeto.id} />
                    <button type="submit" name="statusInterno" value="novo" className="btn btn-secondary btn-sm">
                      Restaurar oportunidade
                    </button>
                  </form>
                )}
              </div>
            </div>


          </div>

          {/* ── RDI ───────────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-rdi">
            <RdiTab projetoId={projeto.id} projetoTitulo={projeto.titulo} />
          </div>

          {/* ── Cliente ───────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-cliente">
            {projeto.cliente ? (
              <div className="obra-card obra-card--full">
                <div className="obra-card-header">
                  <span className="obra-card-label"><UsersIcon size={13} /> Dados do cliente</span>
                  <Link href={`/dashboard/clientes/${projeto.cliente.id}`} style={{ fontSize: 12, color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                    Ver ficha completa <ArrowRightIcon size={11} />
                  </Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--clr-text)" }}>{projeto.cliente.nome}</div>
                  {projeto.cliente.telefone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--clr-text-secondary)" }}>
                      <PhoneIcon size={14} />
                      {projeto.cliente.telefone}
                      <a
                        href={`https://wa.me/${projeto.cliente.telefone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: "var(--clr-primary)", marginLeft: 4 }}
                      >
                        Abrir WhatsApp
                      </a>
                    </div>
                  )}
                  {projeto.cliente.origemContato && (
                    <div style={{ fontSize: 13, color: "var(--clr-text-muted)" }}>
                      Chegou via: {projeto.cliente.origemContato}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <Link href={`/dashboard/clientes/${projeto.cliente.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>
                    <EditIcon size={12} /> Editar cliente
                  </Link>
                  {isGanho && (
                    <Link
                      href={`/dashboard/projetos/${projeto.id}/confirmar-conversao`}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 12 }}
                    >
                      Completar dados e converter
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="callout callout--info">Nenhum cliente vinculado.</div>
            )}

          </div>

          {/* ── Atividades ────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-atividades">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label"><ActivityIcon size={13} /> Atividades comerciais</span>
                <span style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>
                  {projeto.atividades.length} registro{projeto.atividades.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Form de nova atividade */}
              <form action={criarAtividadeProjeto} style={{ marginBottom: 20, padding: "14px 16px", background: "var(--clr-surface)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-border)" }}>
                <input type="hidden" name="projetoId" value={projeto.id} />
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--clr-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  Registrar nova atividade
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <select name="tipo" className="form-input form-select" required style={{ width: 140, flexShrink: 0 }}>
                    <option value="">Tipo...</option>
                    <option value="ligacao">Ligação</option>
                    <option value="visita">Visita</option>
                    <option value="email">E-mail</option>
                    <option value="reuniao">Reunião</option>
                    <option value="nota">Nota</option>
                    <option value="outro">Outro</option>
                  </select>
                  <textarea
                    name="descricao"
                    className="form-input"
                    placeholder="Descreva o contato, próximo passo ou observação relevante..."
                    required
                    minLength={2}
                    maxLength={1000}
                    rows={2}
                    style={{ flex: 1, minWidth: 200, resize: "vertical" }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0, alignSelf: "flex-end" }}>
                    <PlusIcon size={13} /> Salvar
                  </button>
                </div>
              </form>

              {/* Lista de atividades */}
              {projeto.atividades.length === 0 ? (
                <div className="placeholder-block">Nenhuma atividade registrada. Use o campo acima para registrar ligações, visitas e notas.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {projeto.atividades.map((a) => (
                    <div key={a.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--clr-border-light)", flexWrap: "wrap" }}>
                      <div style={{
                        flexShrink: 0,
                        width: 70,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--clr-primary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        paddingTop: 2,
                      }}>
                        {atividadeTipoLabel(a.tipo)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "var(--clr-text)", lineHeight: 1.6 }}>{a.descricao}</div>
                        <div style={{ fontSize: 11, color: "var(--clr-text-muted)", marginTop: 3 }}>
                          {new Date(a.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <details style={{ marginTop: 6 }}>
                          <summary style={{ fontSize: 12, color: "var(--clr-primary)", cursor: "pointer", listStyle: "none", padding: "2px 0" }}>Editar</summary>
                          <form action={editarAtividade} style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                            <input type="hidden" name="atividadeId" value={a.id} />
                            <input type="hidden" name="projetoId" value={projeto.id} />
                            <textarea name="descricao" className="form-input" defaultValue={a.descricao} required minLength={2} maxLength={1000} rows={2} style={{ flex: 1, minWidth: 200, resize: "vertical" }} />
                            <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0, alignSelf: "flex-end" }}>Salvar</button>
                          </form>
                        </details>
                      </div>
                      <form action={deletarAtividade} style={{ flexShrink: 0 }}>
                        <input type="hidden" name="atividadeId" value={a.id} />
                        <input type="hidden" name="projetoId" value={projeto.id} />
                        <button type="submit" title="Excluir" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", color: "var(--clr-text-muted)", fontSize: 13, lineHeight: 1 }}>✕</button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Orçamento ─────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-orcamento">
            <OrcamentoTab {...orcamento} />
          </div>

          {/* ── Tarefas ───────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-tarefas">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label"><TasksIcon size={13} /> Tarefas ({projeto.tarefas.length})</span>
                <span style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>{tarefasConcluidas}/{projeto.tarefas.length} concluídas</span>
              </div>
              {projeto.tarefas.length === 0 ? (
                <div className="placeholder-block">Nenhuma tarefa ainda. Use o campo abaixo para adicionar.</div>
              ) : (
                <div className="task-list">
                  {projeto.tarefas.map((t) => (
                    <div key={t.id} className="task-item" style={{ flexWrap: "wrap" }}>
                      <form action={toggleTarefaStatus}>
                        <input type="hidden" name="tarefaId" value={t.id} />
                        <input type="hidden" name="statusAtual" value={t.status} />
                        <input type="hidden" name="projetoId" value={projeto.id} />
                        <button
                          type="submit"
                          className={`task-toggle ${t.status === "concluida" ? "task-toggle--done" : ""}`}
                          title={t.status === "concluida" ? "Desfazer conclusão" : "Marcar como concluída"}
                        />
                      </form>
                      <div className={`task-desc ${t.status === "concluida" ? "task-desc--done" : ""}`}>{t.descricao}</div>
                      {t.dataPrevista && (
                        <div className="task-date" style={isOverdue(t, now) ? { color: "var(--clr-danger)", fontWeight: 600 } : undefined}>
                          {isOverdue(t, now) && "⚠ "}{formatDate(t.dataPrevista)}
                        </div>
                      )}
                      <span className={`badge badge-${t.status}`} style={{ fontSize: 10 }}>{t.status.replace("_", " ")}</span>
                      {t.origem === "sugerida_ia" && (
                        <span className="badge" style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                          IA
                        </span>
                      )}
                      <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexShrink: 0 }}>
                        <form action={deletarTarefa}>
                          <input type="hidden" name="tarefaId" value={t.id} />
                          <input type="hidden" name="projetoId" value={projeto.id} />
                          <button type="submit" title="Excluir" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", color: "var(--clr-text-muted)", fontSize: 13, lineHeight: 1 }}>✕</button>
                        </form>
                      </div>
                      <details style={{ width: "100%", marginTop: 4 }}>
                        <summary style={{ fontSize: 12, color: "var(--clr-primary)", cursor: "pointer", listStyle: "none", padding: "2px 0" }}>Editar</summary>
                        <form action={editarTarefa} style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                          <input type="hidden" name="tarefaId" value={t.id} />
                          <input type="hidden" name="projetoId" value={projeto.id} />
                          <input name="descricao" type="text" className="form-input" defaultValue={t.descricao} required minLength={2} maxLength={500} style={{ flex: 1, minWidth: 180 }} />
                          <input name="dataPrevista" type="date" className="form-input" defaultValue={t.dataPrevista ? new Date(t.dataPrevista).toISOString().slice(0, 10) : ""} style={{ width: 140, flexShrink: 0 }} />
                          <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Salvar</button>
                        </form>
                      </details>
                    </div>
                  ))}
                </div>
              )}
              <form action={criarTarefa} className="quick-add">
                <input type="hidden" name="projetoId" value={projeto.id} />
                <input name="descricao" type="text" className="form-input" placeholder="Nova tarefa comercial..." required minLength={2} maxLength={500} />
                <input name="dataPrevista" type="date" className="form-input" style={{ width: 160, flexShrink: 0 }} title="Data prevista (opcional)" />
                <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                  <PlusIcon size={14} /> Adicionar
                </button>
              </form>
            </div>
          </div>

          {/* ── Financeiro ────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-financeiro">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label"><FinanceIcon size={13} /> Financeiro da oportunidade</span>
                <span style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>
                  Pré-visita, sinal, adiantamento e outros lançamentos
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Entradas", value: financeiro.totalEntrada, bg: "#f0fdf4", clr: "var(--clr-success)" },
                  { label: "Saídas", value: financeiro.totalSaida, bg: "#fff1f2", clr: "var(--clr-danger)" },
                  { label: "Saldo", value: financeiro.saldo, bg: financeiro.saldo >= 0 ? "#f0fdf4" : "#fff1f2", clr: financeiro.saldo >= 0 ? "var(--clr-success)" : "var(--clr-danger)" },
                ].map(({ label, value, bg, clr }) => (
                  <div key={label} style={{ textAlign: "center", padding: "10px 12px", background: bg, borderRadius: "var(--r-md)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: clr, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: clr }}>{formatCurrency(value)}</div>
                  </div>
                ))}
              </div>
              {projeto.lancamentos.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {projeto.lancamentos.slice(0, 8).map((l) => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--clr-border-light)", fontSize: 13 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: l.tipo === "entrada" ? "var(--clr-success)" : "var(--clr-danger)", flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "var(--clr-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.descricao ?? (l.tipo === "entrada" ? "Entrada" : "Saída")}
                      </span>
                      {l.categoriaFinanceira && (
                        <span style={{ fontSize: 11, color: "var(--clr-text-muted)", flexShrink: 0 }}>
                          {l.categoriaFinanceira.nome}
                        </span>
                      )}
                      {l.totalParcelas && l.totalParcelas > 1 && (
                        <span style={{ fontSize: 11, color: "var(--clr-text-muted)", flexShrink: 0 }}>
                          {l.numeroParcela}/{l.totalParcelas}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "var(--clr-text-muted)", flexShrink: 0 }}>{new Date(l.dataVencimento).toLocaleDateString("pt-BR")}</span>
                      <span style={{ fontWeight: 600, color: l.tipo === "entrada" ? "var(--clr-success)" : "var(--clr-danger)", flexShrink: 0 }}>
                        {l.tipo === "saida" ? "−" : "+"}
                        {Number(l.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                      <span className={`badge badge-${l.status}`} style={{ fontSize: 10, flexShrink: 0 }}>
                        {l.status === "pago" ? "Pago" : l.status === "recebido" ? "Recebido" : l.status === "cancelado" ? "Cancelado" : "Previsto"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <LancamentoFinanceiroForm
                action={criarLancamento}
                projetoId={projeto.id}
                categorias={financeiroFormLists.categorias}
                centrosCusto={financeiroFormLists.centrosCusto}
                fornecedores={financeiroFormLists.fornecedores}
              />
            </div>
          </div>

          {/* ── Histórico ─────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-historico">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label"><HistoryIcon size={13} /> Histórico / Rastreio</span>
              </div>
              {projeto.rastreios.length === 0 ? (
                <div className="placeholder-block">Nenhum evento registrado ainda.</div>
              ) : (
                <div className="rastreio-list">
                  {projeto.rastreios.map((r) => (
                    <div key={r.id} className="rastreio-item">
                      <div className="rastreio-dot" />
                      <div className="rastreio-content">
                        <div className="rastreio-event">{eventoLabel(r.eventoTipo, r.conteudoPersistido)}</div>
                        <div className="rastreio-time">{formatDate(r.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Propostas ─────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-propostas">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label">Propostas</span>
              </div>
              <div className="placeholder-block">Nenhuma proposta ainda.</div>
              <div
                style={{
                  background: "var(--clr-primary-light)",
                  borderRadius: "var(--r-md)",
                  padding: "12px 16px",
                  marginTop: 16,
                  fontSize: 13,
                  color: "var(--clr-primary-text)",
                  lineHeight: 1.7,
                }}
              >
                Geração de propostas em PDF com orçamento aprovado disponível em fase futura
                (integração com Google Drive + Agente de Proposta).
              </div>
            </div>
          </div>

          {/* ── Anotações ─────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-anotacoes">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label">Anotações ({projeto.anotacoes.length})</span>
              </div>
              {projeto.anotacoes.length === 0 ? (
                <div className="placeholder-block">Nenhuma anotação ainda. Use o formulário abaixo para registrar.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  {projeto.anotacoes.map((a) => (
                    <div key={a.id} style={{ padding: "12px 14px", background: "var(--clr-bg-subtle, #f9fafb)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-border-light)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: a.titulo ? 6 : 0 }}>
                        {a.titulo && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--clr-text)" }}>{a.titulo}</span>}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: "var(--clr-text-muted)" }}>{new Date(a.createdAt).toLocaleDateString("pt-BR")}</span>
                          <form action={excluirAnotacao}>
                            <input type="hidden" name="anotacaoId" value={a.id} />
                            <input type="hidden" name="projetoId" value={projeto.id} />
                            <button type="submit" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clr-text-muted)", fontSize: 13, padding: "0 2px" }} title="Excluir anotação">✕</button>
                          </form>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--clr-text-secondary)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{a.conteudo}</p>
                    </div>
                  ))}
                </div>
              )}
              <form action={criarAnotacao} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input type="hidden" name="projetoId" value={projeto.id} />
                <input name="titulo" type="text" className="form-input" placeholder="Título (opcional)..." maxLength={200} />
                <textarea name="conteudo" className="form-input" placeholder="Escreva a anotação..." required minLength={1} rows={4} style={{ resize: "vertical" }} />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className="btn btn-primary btn-sm">+ Salvar anotação</button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Diário ────────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-diario">
            <DiarioTab
              projetoId={projeto.id}
              diarios={diariosObra}
              actions={{ criarDiario, aprovarItem: aprovarItemHITL, rejeitarItem: rejeitarItemHITL }}
            />
          </div>

          {/* ── Agenda ───────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-agenda">
            <AgendaTab
              projetoId={projeto.id}
              empresaId={empresaId}
              criarAgendaItemAction={criarAgendaItemAction}
              marcarAgendaItemRealizadoAction={marcarAgendaItemRealizadoAction}
              cancelarAgendaItemAction={cancelarAgendaItemAction}
            />
          </div>

          {/* ── Agentes ───────────────────────────────────────────── */}
          <div className="obra-tab-panel op-panel-agentes">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label"><AgentsIcon size={13} /> Agentes desta oportunidade</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { nome: "Lia", emoji: "🤝", desc: "Secretária — lê WhatsApp e cria leads", status: "Em desenvolvimento" },
                  { nome: "Otto", emoji: "🧱", desc: "Orçamentista — lê projetos e gera orçamento", status: "Motor real disponível" },
                  { nome: "Sentinela", emoji: "🛡️", desc: "Monitora riscos e desvios", status: "Em desenvolvimento" },
                ].map((ag) => (
                  <div key={ag.nome} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--clr-border-light)" }}>
                    <span style={{ fontSize: 24 }}>{ag.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--clr-text)" }}>{ag.nome}</div>
                      <div style={{ fontSize: 12, color: "var(--clr-text-secondary)" }}>{ag.desc}</div>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--clr-text-muted)", background: "var(--clr-surface-hover)", borderRadius: "var(--r-full)", padding: "3px 10px", border: "1px solid var(--clr-border)", flexShrink: 0 }}>
                      {ag.status}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <Link href="/dashboard/agentes" style={{ fontSize: 13, color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                  Ver central de agentes <ArrowRightIcon size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Visão de Obra (Central da Obra) ─────────────────────────────────────────

function CentralDaObraView({
  projeto,
  empresaId,
  financeiro,
  orcamento,
  financeiroFormLists,
  itensOrcamento,
  medicoes,
  openRdi,
  diariosObra,
}: {
  projeto: ProjetoDetalhes;
  empresaId: string;
  financeiro: Financeiro;
  orcamento: OrcamentoProps;
  financeiroFormLists: FinanceiroFormLists;
  itensOrcamento: React.ComponentProps<typeof PlanejamentoTab>["itens"];
  medicoes: React.ComponentProps<typeof MedicoesTab>["medicoes"];
  openRdi: boolean;
  diariosObra: React.ComponentProps<typeof DiarioTab>["diarios"];
}) {
  const now = new Date();
  const tarefasAbertas = projeto.tarefas.filter((t) => t.status === "aberta" || t.status === "em_andamento");
  const tarefasConcluidas = projeto.tarefas.filter((t) => t.status === "concluida");
  const totalTarefas = projeto.tarefas.length;
  const tarefasAtrasadas = projeto.tarefas.filter((t) => isOverdue(t, now)).length;

  return (
    <div>
      <Link href="/dashboard/projetos?stage=obra" className="back-link">
        ← Obras
      </Link>

      {/* Header da obra */}
      <div className="obra-header">
        <div className="obra-title-block">
          <div className="obra-meta">
            <span className="badge badge-obra">Obra</span>
            {projeto.codigoSequencial && (
              <span className="tipo-tag" data-lia-codigo={projeto.codigoSequencial} style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>{projeto.codigoSequencial}</span>
            )}
            {projeto.numeroObra && <span className="tipo-tag">Nr. {projeto.numeroObra}</span>}
            {tarefasAtrasadas > 0 && (
              <span className="badge" style={{ background: "rgba(239,68,68,.1)", color: "var(--clr-danger)", border: "1px solid rgba(239,68,68,.25)" }}>
                ⚠ {tarefasAtrasadas} atrasada{tarefasAtrasadas !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h1 className="obra-title">{projeto.titulo}</h1>
          <div className="obra-meta">
            <span className="obra-meta-item"><ClockIcon size={13} /> {obraStatusLabel(projeto.statusInterno)}</span>
            {projeto.cliente && (
              <span className="obra-meta-item">
                · Cliente:{" "}
                <Link href={`/dashboard/clientes/${projeto.cliente.id}`} style={{ color: "var(--clr-primary)", fontWeight: 500, marginLeft: 4 }}>
                  {projeto.cliente.nome}
                </Link>
              </span>
            )}
            {projeto.dataInicioEstimada && (
              <span className="obra-meta-item"><CalendarIcon size={13} /> Início: {formatDate(projeto.dataInicioEstimada)}</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/dashboard/projetos/${projeto.id}/editar`} className="btn btn-secondary btn-sm">
            <EditIcon size={13} /> Editar
          </Link>
          <Link href="/dashboard/projetos?stage=obra" className="btn btn-secondary btn-sm">
            ← Voltar
          </Link>
        </div>
      </div>

      {/* Tabs CSS-only — Lote 10E */}
      <div className="obra-tabs">
        <input type="radio" name="obra-tab" id="tab-geral" className="obra-tab-radio" defaultChecked={!openRdi} />
        <input type="radio" name="obra-tab" id="tab-rdi" className="obra-tab-radio" defaultChecked={openRdi} />
        <input type="radio" name="obra-tab" id="tab-atividades" className="obra-tab-radio" />
        <input type="radio" name="obra-tab" id="tab-tarefas" className="obra-tab-radio" />
        <input type="radio" name="obra-tab" id="tab-financeiro" className="obra-tab-radio" />
        <input type="radio" name="obra-tab" id="tab-historico" className="obra-tab-radio" />
        <input type="radio" name="obra-tab" id="tab-orcamento" className="obra-tab-radio" />
        <input type="radio" name="obra-tab" id="tab-planejamento" className="obra-tab-radio" />
        <input type="radio" name="obra-tab" id="tab-compras" className="obra-tab-radio" />
        <input type="radio" name="obra-tab" id="tab-anotacoes" className="obra-tab-radio" />
        <input type="radio" name="obra-tab" id="tab-diario" className="obra-tab-radio" />
        <input type="radio" name="obra-tab" id="tab-agenda" className="obra-tab-radio" />
        <input type="radio" name="obra-tab" id="tab-agentes" className="obra-tab-radio" />

        <div className="obra-tabs-nav">
          <label htmlFor="tab-geral" className="obra-tab-label">Visão Geral</label>
          <label htmlFor="tab-rdi" className="obra-tab-label">RDI</label>
          <label htmlFor="tab-atividades" className="obra-tab-label">
            Atividades{projeto.atividades.length > 0 ? ` (${projeto.atividades.length})` : ""}
          </label>
          <label htmlFor="tab-tarefas" className="obra-tab-label">Tarefas{totalTarefas > 0 ? ` (${totalTarefas})` : ""}</label>
          <label htmlFor="tab-financeiro" className="obra-tab-label">Financeiro</label>
          <label htmlFor="tab-historico" className="obra-tab-label">Histórico</label>
          <label htmlFor="tab-orcamento" className="obra-tab-label">Orçamento</label>
          <label htmlFor="tab-planejamento" className="obra-tab-label">Planejamento</label>
          <label htmlFor="tab-compras" className="obra-tab-label">Compras</label>
          <label htmlFor="tab-anotacoes" className="obra-tab-label">
            Anotações{projeto.anotacoes.length > 0 ? ` (${projeto.anotacoes.length})` : ""}
          </label>
          <label htmlFor="tab-diario" className="obra-tab-label">Diário</label>
          <label htmlFor="tab-agenda" className="obra-tab-label">Agenda</label>
          <label htmlFor="tab-agentes" className="obra-tab-label">Agentes</label>
        </div>

        <div className="obra-tabs-panels">
          {/* Visão Geral */}
          <div className="obra-tab-panel panel-geral">
            {projeto.descricao && (
              <div className="card card-pad" style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 14, color: "var(--clr-text-secondary)", lineHeight: 1.7 }}>{projeto.descricao}</p>
              </div>
            )}
            <div className="obra-grid">
              <div className="obra-card">
                <div className="obra-card-header">
                  <span className="obra-card-label"><ClockIcon size={13} /> Status da obra</span>
                </div>
                <div className="obra-card-value">{obraStatusLabel(projeto.statusInterno)}</div>
                <div style={{ marginTop: 12 }}>
                  <form action={atualizarStatusObra} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <input type="hidden" name="projetoId" value={projeto.id} />
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-text-muted)", marginBottom: 4 }}>Mover para</div>
                    {[
                      { value: "em_andamento", label: "Em andamento" },
                      { value: "pausada", label: "Pausada" },
                      { value: "concluida", label: "Concluída" },
                      { value: "entregue", label: "Entregue" },
                    ]
                      .filter((s) => s.value !== projeto.statusInterno)
                      .map((s) => (
                        <button key={s.value} type="submit" name="statusInterno" value={s.value} className="btn btn-secondary btn-sm" style={{ justifyContent: "flex-start", fontSize: 12 }}>
                          → {s.label}
                        </button>
                      ))}
                  </form>
                </div>
              </div>

              <div className="obra-card">
                <div className="obra-card-header">
                  <span className="obra-card-label"><ArrowRightIcon size={13} /> Próxima ação</span>
                </div>
                {tarefasAbertas.length > 0 ? (
                  <div>
                    <div className="obra-card-value" style={{ fontSize: 14, fontWeight: 600 }}>{tarefasAbertas[0].descricao}</div>
                    {tarefasAbertas[0].dataPrevista && (
                      <div className="obra-card-sub">Prevista para {formatDate(tarefasAbertas[0].dataPrevista)}</div>
                    )}
                    {tarefasAbertas.length > 1 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--clr-text-muted)" }}>
                        + {tarefasAbertas.length - 1} tarefa{tarefasAbertas.length > 2 ? "s" : ""} pendente{tarefasAbertas.length > 2 ? "s" : ""}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="placeholder-block">Nenhuma tarefa aberta. Crie tarefas na aba Tarefas.</div>
                )}
              </div>

              <div className="obra-card">
                <div className="obra-card-header">
                  <span className="obra-card-label"><TruckIcon size={13} /> Fornecedores / Prestadores</span>
                </div>
                <div className="placeholder-block">Vínculo de fornecedores por obra disponível em breve.</div>
                <div style={{ marginTop: 12 }}>
                  <Link href="/dashboard/fornecedores" style={{ fontSize: 13, color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                    Ver fornecedores <ArrowRightIcon size={12} />
                  </Link>
                </div>
              </div>

              <div className="obra-card">
                <div className="obra-card-header">
                  <span className="obra-card-label"><AgentsIcon size={13} /> Agentes atentos nesta obra</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { nome: "Sentinela", emoji: "🛡️", desc: "Monitorando riscos" },
                    { nome: "Lia", emoji: "🤝", desc: "Pronta para atendimento" },
                  ].map((ag) => (
                    <div key={ag.nome} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--clr-border-light)" }}>
                      <span style={{ fontSize: 18 }}>{ag.emoji}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--clr-text)" }}>{ag.nome}</div>
                        <div style={{ fontSize: 11, color: "var(--clr-text-muted)" }}>{ag.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <Link href="/dashboard/agentes" style={{ fontSize: 13, color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                    Ver todos os agentes <ArrowRightIcon size={12} />
                  </Link>
                </div>
              </div>

              <div className="obra-card">
                <div className="obra-card-header">
                  <span className="obra-card-label"><AlertIcon size={13} /> Risco principal</span>
                </div>
                <div className="placeholder-block">Análise de risco disponível com o Agente Sentinela — em breve.</div>
                <div style={{ marginTop: 12 }}>
                  <Link href="/dashboard/agentes" style={{ fontSize: 13, color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                    Ver agentes <ArrowRightIcon size={12} />
                  </Link>
                </div>
              </div>

              <div className="obra-card">
                <div className="obra-card-header">
                  <span className="obra-card-label"><BuildingIcon size={13} /> Dados base</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Criado em", value: formatDate(projeto.createdAt) },
                    { label: "Última atualização", value: formatDate(projeto.updatedAt) },
                    { label: "Origem", value: projeto.origem ?? "—" },
                    { label: "Stage", value: "Obra" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid var(--clr-border-light)", paddingBottom: 6 }}>
                      <span style={{ color: "var(--clr-text-muted)" }}>{label}</span>
                      <span style={{ color: "var(--clr-text)", fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                  {(projeto.logradouroObra || projeto.cidadeObra || projeto.enderecoObra) && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid var(--clr-border-light)", paddingBottom: 6, gap: 8 }}>
                      <span style={{ color: "var(--clr-text-muted)", flexShrink: 0 }}>Endereço</span>
                      <span style={{ color: "var(--clr-text)", fontWeight: 500, textAlign: "right" }}>
                        {projeto.logradouroObra
                          ? [projeto.logradouroObra, projeto.numeroEnderecoObra, projeto.complementoObra, projeto.bairroObra, projeto.cidadeObra, projeto.estadoObra].filter(Boolean).join(", ")
                          : projeto.enderecoObra}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>


          </div>

          {/* RDI */}
          <div className="obra-tab-panel panel-rdi">
            <RdiTab projetoId={projeto.id} projetoTitulo={projeto.titulo} />
          </div>

          {/* Atividades */}
          <div className="obra-tab-panel panel-atividades">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label"><ActivityIcon size={13} /> Atividades comerciais</span>
                <span style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>
                  {projeto.atividades.length} registro{projeto.atividades.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Form de nova atividade */}
              <form action={criarAtividadeProjeto} style={{ marginBottom: 20, padding: "14px 16px", background: "var(--clr-surface)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-border)" }}>
                <input type="hidden" name="projetoId" value={projeto.id} />
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--clr-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  Registrar nova atividade
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <select name="tipo" className="form-input form-select" required style={{ width: 140, flexShrink: 0 }}>
                    <option value="">Tipo...</option>
                    <option value="ligacao">Ligação</option>
                    <option value="visita">Visita</option>
                    <option value="email">E-mail</option>
                    <option value="reuniao">Reunião</option>
                    <option value="nota">Nota</option>
                    <option value="outro">Outro</option>
                  </select>
                  <textarea
                    name="descricao"
                    className="form-input"
                    placeholder="Descreva o contato, próximo passo ou observação relevante..."
                    required
                    minLength={2}
                    maxLength={1000}
                    rows={2}
                    style={{ flex: 1, minWidth: 200, resize: "vertical" }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0, alignSelf: "flex-end" }}>
                    <PlusIcon size={13} /> Salvar
                  </button>
                </div>
              </form>

              {/* Lista de atividades */}
              {projeto.atividades.length === 0 ? (
                <div className="placeholder-block">Nenhuma atividade registrada. Use o campo acima para registrar ligações, visitas e notas.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {projeto.atividades.map((a) => (
                    <div key={a.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--clr-border-light)", flexWrap: "wrap" }}>
                      <div style={{
                        flexShrink: 0,
                        width: 70,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--clr-primary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        paddingTop: 2,
                      }}>
                        {atividadeTipoLabel(a.tipo)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "var(--clr-text)", lineHeight: 1.6 }}>{a.descricao}</div>
                        <div style={{ fontSize: 11, color: "var(--clr-text-muted)", marginTop: 3 }}>
                          {new Date(a.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <details style={{ marginTop: 6 }}>
                          <summary style={{ fontSize: 12, color: "var(--clr-primary)", cursor: "pointer", listStyle: "none", padding: "2px 0" }}>Editar</summary>
                          <form action={editarAtividade} style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                            <input type="hidden" name="atividadeId" value={a.id} />
                            <input type="hidden" name="projetoId" value={projeto.id} />
                            <textarea name="descricao" className="form-input" defaultValue={a.descricao} required minLength={2} maxLength={1000} rows={2} style={{ flex: 1, minWidth: 200, resize: "vertical" }} />
                            <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0, alignSelf: "flex-end" }}>Salvar</button>
                          </form>
                        </details>
                      </div>
                      <form action={deletarAtividade} style={{ flexShrink: 0 }}>
                        <input type="hidden" name="atividadeId" value={a.id} />
                        <input type="hidden" name="projetoId" value={projeto.id} />
                        <button type="submit" title="Excluir" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", color: "var(--clr-text-muted)", fontSize: 13, lineHeight: 1 }}>✕</button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tarefas */}
          <div className="obra-tab-panel panel-tarefas">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label"><TasksIcon size={13} /> Tarefas ({totalTarefas})</span>
                <span style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>{tarefasConcluidas.length}/{totalTarefas} concluídas</span>
              </div>
              {projeto.tarefas.length === 0 ? (
                <div className="placeholder-block">Nenhuma tarefa criada. Use o campo abaixo para adicionar a primeira.</div>
              ) : (
                <div className="task-list">
                  {projeto.tarefas.map((t) => (
                    <div key={t.id} className="task-item" style={{ flexWrap: "wrap" }}>
                      <form action={toggleTarefaStatus}>
                        <input type="hidden" name="tarefaId" value={t.id} />
                        <input type="hidden" name="statusAtual" value={t.status} />
                        <input type="hidden" name="projetoId" value={projeto.id} />
                        <button type="submit" className={`task-toggle ${t.status === "concluida" ? "task-toggle--done" : ""}`} title={t.status === "concluida" ? "Desfazer conclusão" : "Marcar como concluída"} />
                      </form>
                      <div className={`task-desc ${t.status === "concluida" ? "task-desc--done" : ""}`}>{t.descricao}</div>
                      {t.dataPrevista && (
                        <div className="task-date" style={isOverdue(t, now) ? { color: "var(--clr-danger)", fontWeight: 600 } : undefined}>
                          {isOverdue(t, now) && "⚠ "}{formatDate(t.dataPrevista)}
                        </div>
                      )}
                      <span className={`badge badge-${t.status}`} style={{ fontSize: 10 }}>{t.status.replace("_", " ")}</span>
                      {t.origem === "sugerida_ia" && (
                        <span className="badge" style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                          IA
                        </span>
                      )}
                      <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexShrink: 0 }}>
                        <form action={deletarTarefa}>
                          <input type="hidden" name="tarefaId" value={t.id} />
                          <input type="hidden" name="projetoId" value={projeto.id} />
                          <button type="submit" title="Excluir" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", color: "var(--clr-text-muted)", fontSize: 13, lineHeight: 1 }}>✕</button>
                        </form>
                      </div>
                      <details style={{ width: "100%", marginTop: 4 }}>
                        <summary style={{ fontSize: 12, color: "var(--clr-primary)", cursor: "pointer", listStyle: "none", padding: "2px 0" }}>Editar</summary>
                        <form action={editarTarefa} style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                          <input type="hidden" name="tarefaId" value={t.id} />
                          <input type="hidden" name="projetoId" value={projeto.id} />
                          <input name="descricao" type="text" className="form-input" defaultValue={t.descricao} required minLength={2} maxLength={500} style={{ flex: 1, minWidth: 180 }} />
                          <input name="dataPrevista" type="date" className="form-input" defaultValue={t.dataPrevista ? new Date(t.dataPrevista).toISOString().slice(0, 10) : ""} style={{ width: 140, flexShrink: 0 }} />
                          <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Salvar</button>
                        </form>
                      </details>
                    </div>
                  ))}
                </div>
              )}
              <form action={criarTarefa} className="quick-add">
                <input type="hidden" name="projetoId" value={projeto.id} />
                <input name="descricao" type="text" className="form-input" placeholder="Nova tarefa — o que precisa ser feito?" required minLength={2} maxLength={500} />
                <input name="dataPrevista" type="date" className="form-input" style={{ width: 160, flexShrink: 0 }} title="Data prevista (opcional)" />
                <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                  <PlusIcon size={14} /> Adicionar
                </button>
              </form>
            </div>
          </div>

          {/* Financeiro */}
          <div className="obra-tab-panel panel-financeiro">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label"><FinanceIcon size={13} /> Financeiro</span>
                {projeto.lancamentos.length > 0 && (
                  <span style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>
                    {projeto.lancamentos.length} lançamento{projeto.lancamentos.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: projeto.lancamentos.length > 0 ? 16 : 0 }}>
                <div style={{ textAlign: "center", padding: "10px 12px", background: "#f0fdf4", borderRadius: "var(--r-md)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--clr-success)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Entradas</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--clr-success)" }}>{formatCurrency(financeiro.totalEntrada)}</div>
                </div>
                <div style={{ textAlign: "center", padding: "10px 12px", background: "#fff1f2", borderRadius: "var(--r-md)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--clr-danger)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Saídas</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--clr-danger)" }}>{formatCurrency(financeiro.totalSaida)}</div>
                </div>
                <div style={{ textAlign: "center", padding: "10px 12px", background: financeiro.saldo >= 0 ? "#f0fdf4" : "#fff1f2", borderRadius: "var(--r-md)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: financeiro.saldo >= 0 ? "var(--clr-success)" : "var(--clr-danger)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Saldo</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: financeiro.saldo >= 0 ? "var(--clr-success)" : "var(--clr-danger)" }}>{formatCurrency(financeiro.saldo)}</div>
                </div>
              </div>
              {projeto.lancamentos.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {projeto.lancamentos.slice(0, 8).map((l) => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--clr-border-light)", fontSize: 13 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: l.tipo === "entrada" ? "var(--clr-success)" : "var(--clr-danger)", flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "var(--clr-text)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.descricao ?? (l.tipo === "entrada" ? "Entrada" : "Saída")}
                      </span>
                      {l.categoriaFinanceira && (
                        <span style={{ fontSize: 11, color: "var(--clr-text-muted)", flexShrink: 0 }}>
                          {l.categoriaFinanceira.nome}
                        </span>
                      )}
                      {l.totalParcelas && l.totalParcelas > 1 && (
                        <span style={{ fontSize: 11, color: "var(--clr-text-muted)", flexShrink: 0 }}>
                          {l.numeroParcela}/{l.totalParcelas}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "var(--clr-text-muted)", flexShrink: 0 }}>{new Date(l.dataVencimento).toLocaleDateString("pt-BR")}</span>
                      <span style={{ fontWeight: 600, color: l.tipo === "entrada" ? "var(--clr-success)" : "var(--clr-danger)", flexShrink: 0 }}>
                        {l.tipo === "saida" ? "-" : "+"}
                        {Number(l.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                      <span className={`badge badge-${l.status}`} style={{ fontSize: 10, flexShrink: 0 }}>
                        {l.status === "pago" ? "Pago" : l.status === "recebido" ? "Recebido" : l.status === "cancelado" ? "Cancelado" : "Previsto"}
                      </span>
                      {l.status === "previsto" && (
                        <form action={marcarLancamentoPago} style={{ flexShrink: 0 }}>
                          <input type="hidden" name="lancamentoId" value={l.id} />
                          <input type="hidden" name="projetoId" value={projeto.id} />
                          <input type="hidden" name="tipo" value={l.tipo} />
                          <button type="submit" className="btn btn-sm btn-secondary" style={{ fontSize: 11, padding: "2px 8px" }}>
                            {l.tipo === "entrada" ? "Recebido" : "Pago"}
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <LancamentoFinanceiroForm
                action={criarLancamento}
                projetoId={projeto.id}
                categorias={financeiroFormLists.categorias}
                centrosCusto={financeiroFormLists.centrosCusto}
                fornecedores={financeiroFormLists.fornecedores}
              />
            </div>
          </div>

          {/* Histórico */}
          <div className="obra-tab-panel panel-historico">
            <div className="obra-card">
              <div className="obra-card-header">
                <span className="obra-card-label"><HistoryIcon size={13} /> Histórico / Rastreio</span>
              </div>
              {projeto.rastreios.length === 0 ? (
                <div className="placeholder-block">Nenhum evento registrado ainda.</div>
              ) : (
                <div className="rastreio-list">
                  {projeto.rastreios.map((r) => (
                    <div key={r.id} className="rastreio-item">
                      <div className="rastreio-dot" />
                      <div className="rastreio-content">
                        <div className="rastreio-event">{eventoLabel(r.eventoTipo, r.conteudoPersistido)}</div>
                        <div className="rastreio-time">{formatDate(r.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Orçamento — D4 */}
          <div className="obra-tab-panel panel-orcamento">
            <OrcamentoTab {...orcamento} />
          </div>

          {/* Planejamento — Lote D6 */}
          <div className="obra-tab-panel panel-planejamento">
            {/* Sub-tabs — name diferente do pai para não conflitar */}
            <input type="radio" name="obra-sub" id="sub-plan" className="obra-sub-radio" defaultChecked />
            <input type="radio" name="obra-sub" id="sub-med" className="obra-sub-radio" />
            <input type="radio" name="obra-sub" id="sub-ff" className="obra-sub-radio" />
            <input type="radio" name="obra-sub" id="sub-cs" className="obra-sub-radio" />

            <div className="obra-sub-nav">
              <label htmlFor="sub-plan" className="obra-sub-label">Planejamento</label>
              <label htmlFor="sub-med" className="obra-sub-label">Medições</label>
              <label htmlFor="sub-ff" className="obra-sub-label">Físico-Financeiro</label>
              <label htmlFor="sub-cs" className="obra-sub-label">Curva S</label>
            </div>

            <div className="obra-sub-panels">
              <div className="obra-sub-panel sub-panel-plan">
                <PlanejamentoTab projetoId={projeto.id} itens={itensOrcamento} action={salvarPlanejamentoItem} />
              </div>
              <div className="obra-sub-panel sub-panel-med">
                <MedicoesTab projetoId={projeto.id} medicoes={medicoes} itensOrcamento={itensOrcamento} action={criarMedicao} />
              </div>
              <div className="obra-sub-panel sub-panel-ff">
                <FisicoFinanceiroTab itens={itensOrcamento} />
              </div>
              <div className="obra-sub-panel sub-panel-cs">
                <CurvaSTab itens={itensOrcamento} />
              </div>
            </div>
          </div>

          {/* Compras — Lote 10E */}
          <div className="obra-tab-panel panel-compras">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label">Compras e materiais</span>
              </div>
              <div className="placeholder-block">Pedidos, cotações e entregas de material serão registrados aqui.</div>
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <Link href="/dashboard/fornecedores" style={{ fontSize: 13, color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                  Ver fornecedores cadastrados <ArrowRightIcon size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Anotações */}
          <div className="obra-tab-panel panel-anotacoes">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label">Anotações ({projeto.anotacoes.length})</span>
              </div>
              {projeto.anotacoes.length === 0 ? (
                <div className="placeholder-block">Nenhuma anotação ainda. Use o formulário abaixo para registrar.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  {projeto.anotacoes.map((a) => (
                    <div key={a.id} style={{ padding: "12px 14px", background: "var(--clr-bg-subtle, #f9fafb)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-border-light)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: a.titulo ? 6 : 0 }}>
                        {a.titulo && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--clr-text)" }}>{a.titulo}</span>}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: "var(--clr-text-muted)" }}>{new Date(a.createdAt).toLocaleDateString("pt-BR")}</span>
                          <form action={excluirAnotacao}>
                            <input type="hidden" name="anotacaoId" value={a.id} />
                            <input type="hidden" name="projetoId" value={projeto.id} />
                            <button type="submit" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clr-text-muted)", fontSize: 13, padding: "0 2px" }} title="Excluir anotação">✕</button>
                          </form>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--clr-text-secondary)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{a.conteudo}</p>
                    </div>
                  ))}
                </div>
              )}
              <form action={criarAnotacao} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input type="hidden" name="projetoId" value={projeto.id} />
                <input name="titulo" type="text" className="form-input" placeholder="Título (opcional)..." maxLength={200} />
                <textarea name="conteudo" className="form-input" placeholder="Escreva a anotação..." required minLength={1} rows={4} style={{ resize: "vertical" }} />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className="btn btn-primary btn-sm">+ Salvar anotação</button>
                </div>
              </form>
            </div>
          </div>

          {/* Diário de Obra */}
          <div className="obra-tab-panel panel-diario">
            <DiarioTab
              projetoId={projeto.id}
              diarios={diariosObra}
              actions={{ criarDiario, aprovarItem: aprovarItemHITL, rejeitarItem: rejeitarItemHITL }}
            />
          </div>

          {/* Agenda */}
          <div className="obra-tab-panel panel-agenda">
            <AgendaTab
              projetoId={projeto.id}
              empresaId={empresaId}
              criarAgendaItemAction={criarAgendaItemAction}
              marcarAgendaItemRealizadoAction={marcarAgendaItemRealizadoAction}
              cancelarAgendaItemAction={cancelarAgendaItemAction}
            />
          </div>

          {/* Agentes — Lote 10E */}
          <div className="obra-tab-panel panel-agentes">
            <div className="obra-card obra-card--full">
              <div className="obra-card-header">
                <span className="obra-card-label"><AgentsIcon size={13} /> Agentes desta obra</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { nome: "Sentinela", emoji: "🛡️", desc: "Monitora riscos, desvios de prazo e orçamento", status: "Em desenvolvimento" },
                  { nome: "Otto", emoji: "🧱", desc: "Orçamentista — lê projetos e gera orçamento", status: "Motor real disponível" },
                  { nome: "Lia", emoji: "🤝", desc: "Secretária — lê WhatsApp, cria lançamentos e avisos", status: "Em desenvolvimento" },
                  { nome: "Diário", emoji: "📋", desc: "Registra avanço físico diário da obra", status: "Backlog" },
                  { nome: "Comprador", emoji: "🛒", desc: "Cotações, pedidos e recebimento de material", status: "Backlog" },
                ].map((ag) => (
                  <div
                    key={ag.nome}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 0",
                      borderBottom: "1px solid var(--clr-border-light)",
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{ag.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--clr-text)" }}>{ag.nome}</div>
                      <div style={{ fontSize: 12, color: "var(--clr-text-secondary)" }}>{ag.desc}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: ag.status === "Motor real disponível" ? "var(--clr-success)" : "var(--clr-text-muted)",
                        background: ag.status === "Motor real disponível" ? "#f0fdf4" : "var(--clr-surface-hover)",
                        borderRadius: "var(--r-full)",
                        padding: "3px 10px",
                        border: ag.status === "Motor real disponível" ? "1px solid #bbf7d0" : "1px solid var(--clr-border)",
                        flexShrink: 0,
                      }}
                    >
                      {ag.status}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <Link href="/dashboard/agentes" style={{ fontSize: 13, color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                  Central de agentes <ArrowRightIcon size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page

export default async function ProjetoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string>> }) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const openRdi = sp.rdi === "1";

  const projeto = await getProjetoWithDetails(empresaId, id);
  if (!projeto) notFound();

  const [financeiro, itensOrcamentoRaw, bibliotecaItens, categorias, centrosCusto, fornecedores, medicoes, sessaoOttoRaw] = await Promise.all([
    sumLancamentosByProjeto(empresaId, id),
    listItensOrcamentoByProjeto(empresaId, id),
    listItensByEmpresa(empresaId),
    listCategoriasByEmpresa(empresaId, { take: 100 }),
    listCentrosCustoByEmpresa(empresaId, { take: 50 }),
    listFornecedoresByEmpresa(empresaId, { take: 100 }),
    listMedicoesByProjeto(empresaId, id),
    getOttoSessaoAtiva(empresaId, id),
  ]);

  const itensOrcamento = itensOrcamentoRaw.map((i) => ({
    id: i.id,
    descricao: i.nome,
    nivel: i.tipo === "nivel" ? 1 : i.tipo === "subnivel" ? 2 : 3,
    posicao: i.posicao,
    parentId: i.parentId,
    dataInicioPlano: i.dataInicioPlano,
    dataFimPlano: i.dataFimPlano,
    diasDuracao: i.diasDuracao,
    responsavel: i.responsavel,
    custoTotal: i.servicos ? Number(i.servicos) : null,
  }));

  const orcamentoProps = {
    items: itensOrcamentoRaw.map((i) => ({
      ...i,
      quantidade: i.quantidade ? Number(i.quantidade) : null,
      custoServicos: i.custoServicos ? Number(i.custoServicos) : null,
      bdi: i.bdi ? Number(i.bdi) : null,
      produtos: i.produtos ? Number(i.produtos) : null,
      servicos: i.servicos ? Number(i.servicos) : null,
      statusItem: i.statusItem ?? null,
    })),
    projetoId: projeto.id,
    bibliotecaItens: bibliotecaItens.map((b) => ({
      id: b.id,
      nome: b.nome,
      codigo: b.codigo ?? null,
    })),
    actions: {
      criarGrupo: criarGrupoOrcamento,
      criarItem: criarItemOrcamento,
      editarItem: editarItemOrcamento,
      excluirItem: excluirItemOrcamento,
    },
    sessaoOtto: sessaoOttoRaw ? {
      id: sessaoOttoRaw.id,
      projetoId: sessaoOttoRaw.projetoId,
      estado: sessaoOttoRaw.estado,
      leituraTecnica: sessaoOttoRaw.leituraTecnica,
      documentos: sessaoOttoRaw.documentos.map((d) => ({
        id: d.id,
        tipo: d.tipo,
        titulo: d.titulo,
        conteudo: d.conteudo,
        url: d.url,
      })),
      decisoes: sessaoOttoRaw.decisoes.map((d) => ({
        id: d.id,
        pergunta: d.pergunta,
        resposta: d.resposta,
        impacto: d.impacto,
        status: d.status,
        posicao: d.posicao,
      })),
      itensEAP: sessaoOttoRaw.itensEAP.map((i) => ({
        id: i.id,
        parentId: i.parentId,
        posicao: i.posicao,
        nivelEAP: i.nivelEAP,
        nome: i.nome,
        descricao: i.descricao,
        unidade: i.unidade,
        quantidade: i.quantidade != null ? Number(i.quantidade) : null,
        statusEscopo: i.statusEscopo,
        natureza: i.natureza,
        confianca: i.confianca,
        fonte: i.fonte,
        aprovado: i.aprovado,
        exportado: i.exportado,
      })),
    } : null,
  };

  const financeiroFormLists = {
    categorias: categorias.map((c) => ({ id: c.id, nome: c.nome, tipo: c.tipo })),
    centrosCusto: centrosCusto.map((c) => ({ id: c.id, nome: c.nome })),
    fornecedores: fornecedores.map((f) => ({ id: f.id, nome: f.nome })),
  };

  const medicoesFormatadas = medicoes.map((m) => ({
    id: m.id,
    numero: m.numero,
    dataReferencia: m.dataReferencia,
    observacao: m.observacao,
    itens: m.itens.map((item) => ({
      itemId: item.itemOrcamentoId,
      percentual: item.percentualMedido !== null ? Number(item.percentualMedido) : null,
      valorMedido: item.valorMedido !== null ? Number(item.valorMedido) : null,
    })),
  }));

  if (projeto.stage === "oportunidade") {
    return (
      <OportunidadeView
        projeto={projeto}
        empresaId={empresaId}
        financeiro={financeiro}
        orcamento={orcamentoProps}
        financeiroFormLists={financeiroFormLists}
        openRdi={openRdi}
        diariosObra={(projeto.diariosObra ?? []).map((d) => ({
          ...d,
          itensHITL: d.itensHITL.map((i) => ({
            ...i,
            percentual: i.percentual !== null ? Number(i.percentual) : null,
            confianca: Number(i.confianca),
          })),
        }))}
      />
    );
  }

  return (
    <CentralDaObraView
      projeto={projeto}
      empresaId={empresaId}
      financeiro={financeiro}
      orcamento={orcamentoProps}
      financeiroFormLists={financeiroFormLists}
      itensOrcamento={itensOrcamento}
      medicoes={medicoesFormatadas}
      openRdi={openRdi}
      diariosObra={(projeto.diariosObra ?? []).map((d) => ({
        ...d,
        itensHITL: d.itensHITL.map((i) => ({
          ...i,
          percentual: i.percentual !== null ? Number(i.percentual) : null,
          confianca: Number(i.confianca),
        })),
      }))}
    />
  );
}
