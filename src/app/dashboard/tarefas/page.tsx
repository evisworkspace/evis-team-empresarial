import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listTarefasByEmpresa, countTarefasByEmpresa, countOverdueTarefasByEmpresa } from "@/data/tarefa";
import { TasksIcon, ArrowRightIcon, CalendarIcon } from "@/components/Icons";
import { toggleTarefaStatus } from "@/actions/tarefa";

export const metadata: Metadata = { title: "Tarefas" };

function isOverdue(dataPrevista: Date | null, status: string) {
  if (!dataPrevista || status === "concluida" || status === "cancelada") return false;
  return new Date(dataPrevista) < new Date();
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    aberta: "Aberta",
    em_andamento: "Em andamento",
    concluida: "Concluída",
    cancelada: "Cancelada",
  };
  return map[status] ?? status;
}

function formatDate(d: Date | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("pt-BR");
}

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; overdue?: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { status: statusFilter, overdue } = await searchParams;
  const showOverdue = overdue === "1";

  const [tarefasRaw, totalAbertas, totalEmAndamento, totalConcluidas, totalAtrasadas] = await Promise.all([
    listTarefasByEmpresa(empresaId, { status: statusFilter }),
    countTarefasByEmpresa(empresaId, "aberta"),
    countTarefasByEmpresa(empresaId, "em_andamento"),
    countTarefasByEmpresa(empresaId, "concluida"),
    countOverdueTarefasByEmpresa(empresaId),
  ]);

  const now = new Date();
  const tarefas = showOverdue
    ? tarefasRaw.filter(
        (t) =>
          t.dataPrevista != null &&
          new Date(t.dataPrevista) < now &&
          t.status !== "concluida" &&
          t.status !== "cancelada",
      )
    : tarefasRaw;

  const totalAtivas = totalAbertas + totalEmAndamento;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Tarefas</h1>
            <p className="page-subtitle">
              {totalAtivas} tarefa{totalAtivas !== 1 ? "s" : ""} ativa{totalAtivas !== 1 ? "s" : ""} · {totalAbertas} aberta{totalAbertas !== 1 ? "s" : ""} · {totalEmAndamento} em andamento
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Link href="/dashboard/tarefas" className={`btn btn-sm ${!statusFilter ? "btn-primary" : "btn-secondary"}`}>
          Todas
        </Link>
        <Link href="/dashboard/tarefas?status=aberta" className={`btn btn-sm ${statusFilter === "aberta" ? "btn-primary" : "btn-secondary"}`}>
          Abertas ({totalAbertas})
        </Link>
        <Link href="/dashboard/tarefas?status=em_andamento" className={`btn btn-sm ${statusFilter === "em_andamento" ? "btn-primary" : "btn-secondary"}`}>
          Em andamento ({totalEmAndamento})
        </Link>
        <Link href="/dashboard/tarefas?status=concluida" className={`btn btn-sm ${statusFilter === "concluida" ? "btn-primary" : "btn-secondary"}`}>
          Concluídas ({totalConcluidas})
        </Link>
        {totalAtrasadas > 0 && (
          <Link
            href="/dashboard/tarefas?overdue=1"
            className={`btn btn-sm ${showOverdue ? "btn-primary" : "btn-secondary"}`}
            style={!showOverdue ? { color: "var(--clr-danger)", borderColor: "rgba(239,68,68,.3)" } : undefined}
          >
            ⚠ Atrasadas ({totalAtrasadas})
          </Link>
        )}
      </div>

      {/* Callout */}
      <div className="callout callout--info" style={{ marginBottom: 20 }}>
        <span style={{ flexShrink: 0, display: "flex" }}><TasksIcon size={15} /></span>
        <span>
          Tarefas são criadas dentro de cada obra. Acesse uma obra e use o campo de adição rápida na Central da Obra.{" "}
          <Link href="/dashboard/projetos">Ver projetos</Link>
        </span>
      </div>

      {tarefas.length === 0 ? (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">
              <TasksIcon size={24} />
            </div>
            <div className="empty-state-title">Nenhuma tarefa encontrada</div>
            <p className="empty-state-sub">
              Crie tarefas dentro das suas obras na Central da Obra.
            </p>
            <Link href="/dashboard/projetos" className="btn btn-primary" style={{ marginTop: 8 }}>
              <ArrowRightIcon size={14} />
              Ver projetos e obras
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
                  <th>Status</th>
                  <th>Prazo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tarefas.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {t.projeto && (
                          <form action={toggleTarefaStatus} style={{ flexShrink: 0 }}>
                            <input type="hidden" name="tarefaId" value={t.id} />
                            <input type="hidden" name="statusAtual" value={t.status} />
                            <input type="hidden" name="projetoId" value={t.projeto.id} />
                            <button
                              type="submit"
                              className={`task-toggle${t.status === "concluida" ? " task-toggle--done" : ""}`}
                              title={t.status === "concluida" ? "Reabrir tarefa" : "Marcar como concluída"}
                            />
                          </form>
                        )}
                        <div className={t.status === "concluida" ? "task-desc--done" : ""} style={{ color: "var(--clr-text)" }}>
                          {t.descricao}
                        </div>
                        {t.origem === "sugerida_ia" && (
                          <span className="badge" style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                            IA
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {t.projeto ? (
                        <Link href={`/dashboard/projetos/${t.projeto.id}`} style={{ color: "var(--clr-primary)", fontWeight: 500 }}>
                          {t.projeto.titulo}
                        </Link>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`badge badge-${t.status}`}>{statusLabel(t.status)}</span>
                    </td>
                    <td style={{ fontSize: 13, color: isOverdue(t.dataPrevista, t.status) ? "var(--clr-danger)" : "var(--clr-text-muted)" }}>
                      {t.dataPrevista ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: isOverdue(t.dataPrevista, t.status) ? 600 : undefined }}>
                          <CalendarIcon size={12} />
                          {isOverdue(t.dataPrevista, t.status) && "⚠ "}
                          {formatDate(t.dataPrevista)}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      {t.projeto && (
                        <Link href={`/dashboard/projetos/${t.projeto.id}`} className="btn btn-sm btn-secondary">
                          Obra <ArrowRightIcon size={12} />
                        </Link>
                      )}
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
