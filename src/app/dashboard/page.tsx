import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getEmpresaById } from "@/data/empresa";
import { countProjetosByEmpresa, listProjetosByEmpresaWithCliente } from "@/data/projeto";
import { sumLancamentosByEmpresa } from "@/data/financeiro";
import { countClientesByEmpresa } from "@/data/cliente";
import { countFornecedoresByEmpresa } from "@/data/fornecedor";
import { countTarefasByEmpresa, countOverdueTarefasByEmpresa } from "@/data/tarefa";
import {
  BuildingIcon,
  UsersIcon,
  TruckIcon,
  TasksIcon,
  AgentsIcon,
  FinanceIcon,
  PlusIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
} from "@/components/Icons";

export const metadata: Metadata = { title: "Dashboard" };

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardPage() {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const [empresa, obrasCount, opCount, clientesCount, fornecedoresCount, tarefasAbertas, tarefasAtrasadas, recentes, saldoFinanceiro] =
    await Promise.all([
      getEmpresaById(empresaId),
      countProjetosByEmpresa(empresaId, "obra"),
      countProjetosByEmpresa(empresaId, "oportunidade", { excludeStatusInterno: "perdido" }),
      countClientesByEmpresa(empresaId),
      countFornecedoresByEmpresa(empresaId),
      countTarefasByEmpresa(empresaId, "aberta"),
      countOverdueTarefasByEmpresa(empresaId),
      listProjetosByEmpresaWithCliente(empresaId, { take: 5 }),
      sumLancamentosByEmpresa(empresaId),
    ]);

  const firstName = (session!.user.name ?? "").split(" ")[0] || "Usuário";
  const hasObras = obrasCount > 0;
  const hasClientes = clientesCount > 0;

  return (
    <div>
      {/* Welcome */}
      <div className="welcome-header">
        <div>
          <h1 className="welcome-greeting">Olá, {firstName}!</h1>
          <p className="welcome-sub">
            Bem-vindo ao EVIS — {empresa?.nome ?? "sua empresa"}.
            {!hasObras && !hasClientes && (
              <span style={{ color: "var(--clr-primary)", fontWeight: 600 }}>
                {" "}Vamos criar sua primeira obra?
              </span>
            )}
          </p>
        </div>
        <Link href="/dashboard/projetos/novo" className="btn btn-primary btn-lg">
          <PlusIcon size={16} />
          Criar obra
        </Link>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <Link href="/dashboard/projetos?stage=obra" className="stat-card">
          <div className="stat-card__icon-wrap icon-green">
            <BuildingIcon size={18} />
          </div>
          <div className="stat-card__value">{obrasCount}</div>
          <div className="stat-card__label">Obras ativas</div>
          <div className="stat-card__sub">
            {obrasCount === 0 ? "Nenhuma obra criada" : `${obrasCount} em andamento`}
          </div>
        </Link>

        <Link href="/dashboard/projetos?stage=oportunidade" className="stat-card">
          <div className="stat-card__icon-wrap icon-blue">
            <BuildingIcon size={18} />
          </div>
          <div className="stat-card__value">{opCount}</div>
          <div className="stat-card__label">Oportunidades</div>
          <div className="stat-card__sub">
            {opCount === 0 ? "Nenhuma oportunidade" : `${opCount} em prospecção`}
          </div>
        </Link>

        <Link href="/dashboard/clientes" className="stat-card">
          <div className="stat-card__icon-wrap icon-purple">
            <UsersIcon size={18} />
          </div>
          <div className="stat-card__value">{clientesCount}</div>
          <div className="stat-card__label">Clientes</div>
          <div className="stat-card__sub">
            {clientesCount === 0 ? "Nenhum cliente" : `${clientesCount} cadastrados`}
          </div>
        </Link>

        <Link href="/dashboard/fornecedores" className="stat-card">
          <div className="stat-card__icon-wrap icon-orange">
            <TruckIcon size={18} />
          </div>
          <div className="stat-card__value">{fornecedoresCount}</div>
          <div className="stat-card__label">Fornecedores</div>
          <div className="stat-card__sub">
            {fornecedoresCount === 0 ? "Nenhum cadastrado" : `${fornecedoresCount} ativos`}
          </div>
        </Link>

        <Link href="/dashboard/tarefas?status=aberta" className="stat-card">
          <div
            className="stat-card__icon-wrap"
            style={{ background: tarefasAtrasadas > 0 ? "rgba(239,68,68,.1)" : "rgba(234,179,8,.1)" }}
          >
            <TasksIcon size={18} />
          </div>
          <div
            className="stat-card__value"
            style={{ color: tarefasAtrasadas > 0 ? "var(--clr-danger)" : undefined }}
          >
            {tarefasAbertas}
          </div>
          <div className="stat-card__label">Tarefas abertas</div>
          <div className="stat-card__sub" style={{ color: tarefasAtrasadas > 0 ? "var(--clr-danger)" : undefined }}>
            {tarefasAtrasadas > 0
              ? `⚠ ${tarefasAtrasadas} atrasada${tarefasAtrasadas !== 1 ? "s" : ""}`
              : tarefasAbertas === 0 ? "Nenhuma pendente" : `${tarefasAbertas} aguardando`}
          </div>
        </Link>

        <Link href="/dashboard/financeiro" className="stat-card">
          <div
            className="stat-card__icon-wrap"
            style={{ background: saldoFinanceiro.saldo >= 0 ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)" }}
          >
            <FinanceIcon size={18} />
          </div>
          <div
            className="stat-card__value"
            style={{ color: saldoFinanceiro.saldo >= 0 ? "var(--clr-success)" : "var(--clr-danger)", fontSize: 18 }}
          >
            {formatCurrency(saldoFinanceiro.saldo)}
          </div>
          <div className="stat-card__label">Saldo financeiro</div>
          <div className="stat-card__sub">
            {saldoFinanceiro.totalEntrada === 0 && saldoFinanceiro.totalSaida === 0
              ? "Nenhum lançamento"
              : `${formatCurrency(saldoFinanceiro.totalEntrada)} entrada`}
          </div>
        </Link>

        <Link href="/dashboard/agentes" className="stat-card">
          <div className="stat-card__icon-wrap icon-slate">
            <AgentsIcon size={18} />
          </div>
          <div className="stat-card__value">4</div>
          <div className="stat-card__label">Agentes EVIS</div>
          <div className="stat-card__sub">Lia · Otto · Evandro IA · Sentinela</div>
        </Link>
      </div>

      {/* Início rápido */}
      {(!hasObras || !hasClientes) && (
        <div className="quickstart">
          <div className="quickstart-title">Início rápido</div>
          <ul className="quickstart-list">
            <li className="quickstart-item">
              <div className="quickstart-check quickstart-check--done">
                <CheckIcon size={10} />
              </div>
              <span>Empresa criada — <strong>{empresa?.nome}</strong></span>
            </li>
            <li className="quickstart-item">
              <div className={`quickstart-check ${hasClientes ? "quickstart-check--done" : ""}`}>
                {hasClientes && <CheckIcon size={10} />}
              </div>
              {hasClientes ? (
                <span>Primeiro cliente cadastrado</span>
              ) : (
                <span>
                  <Link href="/dashboard/clientes/novo">Cadastrar primeiro cliente</Link>
                  {" "}— associe clientes às suas obras
                </span>
              )}
            </li>
            <li className="quickstart-item">
              <div className={`quickstart-check ${hasObras ? "quickstart-check--done" : ""}`}>
                {hasObras && <CheckIcon size={10} />}
              </div>
              {hasObras ? (
                <span>Primeira obra criada</span>
              ) : (
                <span>
                  <Link href="/dashboard/projetos/novo">Criar primeira obra</Link>
                  {" "}— comece a operar
                </span>
              )}
            </li>
            <li className="quickstart-item">
              <div className="quickstart-check" />
              <span>
                <Link href="/dashboard/agentes">Conhecer os Agentes EVIS</Link>
                {" "}— veja quem cuida da sua operação
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Atalhos quando já tem dados */}
      {(hasObras || hasClientes) && (
        <div className="section-grid" style={{ marginTop: 0 }}>
          {hasObras && (
            <div className="card card-pad">
              <div className="card-title">Projetos e Obras</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/dashboard/projetos?stage=obra" className="btn btn-secondary btn-sm">
                  Ver obras <ArrowRightIcon size={14} />
                </Link>
                <Link href="/dashboard/projetos/novo" className="btn btn-primary btn-sm">
                  <PlusIcon size={14} /> Nova obra
                </Link>
              </div>
            </div>
          )}
          {hasClientes && (
            <div className="card card-pad">
              <div className="card-title">Clientes</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/dashboard/clientes" className="btn btn-secondary btn-sm">
                  Ver clientes <ArrowRightIcon size={14} />
                </Link>
                <Link href="/dashboard/clientes/novo" className="btn btn-primary btn-sm">
                  <PlusIcon size={14} /> Novo cliente
                </Link>
              </div>
            </div>
          )}
          {fornecedoresCount > 0 && (
            <div className="card card-pad">
              <div className="card-title">Fornecedores</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/dashboard/fornecedores" className="btn btn-secondary btn-sm">
                  Ver todos <ArrowRightIcon size={14} />
                </Link>
                <Link href="/dashboard/fornecedores/novo" className="btn btn-primary btn-sm">
                  <PlusIcon size={14} /> Novo
                </Link>
              </div>
            </div>
          )}
          {tarefasAbertas > 0 && (
            <div className="card card-pad">
              <div className="card-title">Tarefas abertas</div>
              <div style={{ fontSize: 14, color: "var(--clr-text-secondary)", marginBottom: 10 }}>
                {tarefasAbertas} tarefa{tarefasAbertas !== 1 ? "s" : ""} aguardando execução
              </div>
              <Link href="/dashboard/tarefas?status=aberta" className="btn btn-secondary btn-sm">
                Ver tarefas <ArrowRightIcon size={14} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Atividade recente */}
      {recentes.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-pad" style={{ paddingBottom: 0 }}>
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ClockIcon size={14} />
              Projetos e obras recentes
            </div>
          </div>
          <div className="table-wrap">
            <table className="evis-table">
              <tbody>
                {recentes.map((p) => (
                  <tr key={p.id}>
                    <td style={{ width: "100%" }}>
                      <div style={{ fontWeight: 600, color: "var(--clr-text)", fontSize: 13 }}>{p.titulo}</div>
                      {p.cliente && (
                        <div style={{ fontSize: 11, color: "var(--clr-text-muted)", marginTop: 2 }}>{p.cliente.nome}</div>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span className={`badge ${p.stage === "obra" ? "badge-obra" : "badge-oportunidade"}`} style={{ fontSize: 10 }}>
                        {p.stage === "obra" ? "Obra" : "Oportunidade"}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Link href={`/dashboard/projetos/${p.id}`} className="btn btn-sm btn-secondary">
                        Abrir <ArrowRightIcon size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-pad" style={{ paddingTop: 8 }}>
            <Link href="/dashboard/projetos" style={{ fontSize: 13, color: "var(--clr-primary)" }}>
              Ver todos os projetos <ArrowRightIcon size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
