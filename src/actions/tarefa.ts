"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createTarefa, updateTarefa } from "@/data/tarefa";
import { createAuditEntry } from "@/lib/audit";

export async function criarTarefa(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const projetoId = formData.get("projetoId") as string;
  const descricao = (formData.get("descricao") as string)?.trim();
  const dataPrevistaStr = (formData.get("dataPrevista") as string)?.trim();

  if (!projetoId || !descricao || descricao.length < 2) {
    throw new Error("Projeto e descrição são obrigatórios.");
  }

  const dataPrevista = dataPrevistaStr ? new Date(dataPrevistaStr) : undefined;

  const tarefa = await createTarefa(empresaId, {
    projetoId,
    descricao,
    dataPrevista,
    status: "aberta",
  });

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "criacao",
    entidadeTipo: "tarefa",
    entidadeId: tarefa.id,
    conteudoPersistido: { descricao, projetoId },
  });

  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function toggleTarefaStatus(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const tarefaId = formData.get("tarefaId") as string;
  const statusAtual = formData.get("statusAtual") as string;
  const projetoId = formData.get("projetoId") as string;

  if (!tarefaId || !projetoId) throw new Error("Dados da tarefa obrigatórios.");

  const novoStatus = statusAtual === "concluida" ? "aberta" : "concluida";

  const result = await updateTarefa(empresaId, tarefaId, { status: novoStatus });
  if (result.count === 0) throw new Error("Tarefa não encontrada.");

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "alteracao_status",
    entidadeTipo: "tarefa",
    entidadeId: tarefaId,
    conteudoPersistido: { de: statusAtual, para: novoStatus },
  });

  revalidatePath(`/dashboard/projetos/${projetoId}`);
  revalidatePath(`/dashboard/tarefas`);
}
