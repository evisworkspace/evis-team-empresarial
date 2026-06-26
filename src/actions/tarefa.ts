"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createTarefa, updateTarefa, editTarefa, deleteTarefa } from "@/data/tarefa";
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

export async function editarTarefa(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const tarefaId = formData.get("tarefaId") as string;
  const projetoId = formData.get("projetoId") as string;
  const descricao = (formData.get("descricao") as string)?.trim();
  const dataPrevistaStr = (formData.get("dataPrevista") as string)?.trim();

  if (!tarefaId || !projetoId || !descricao || descricao.length < 2) {
    throw new Error("Descrição é obrigatória.");
  }

  const dataPrevista = dataPrevistaStr ? new Date(dataPrevistaStr) : null;

  const result = await editTarefa(empresaId, tarefaId, {
    descricao,
    ...(dataPrevista !== null ? { dataPrevista } : {}),
  });
  if (result.count === 0) throw new Error("Tarefa não encontrada.");

  revalidatePath(`/dashboard/projetos/${projetoId}`);
  revalidatePath(`/dashboard/tarefas`);
}

export async function deletarTarefa(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const tarefaId = formData.get("tarefaId") as string;
  const projetoId = formData.get("projetoId") as string;

  if (!tarefaId || !projetoId) throw new Error("Dados obrigatórios.");

  await deleteTarefa(empresaId, tarefaId);

  revalidatePath(`/dashboard/projetos/${projetoId}`);
  revalidatePath(`/dashboard/tarefas`);
}

// ─── Motor semântico de tarefas — Adendo D4 ──────────────────────────────────

/**
 * Retorna sugestões contextuais para o primeiro item de orçamento.
 * Não cria nada — exibe para validação HITL (SugestaoTarefasCard).
 */
export async function sugerirTarefasOrcamento(
  // reservado para versão futura com LLM contextual
  _projetoId: string,
): Promise<string[]> {
  return [
    "Revisar arquivos e escopo recebidos do cliente",
    "Levantar pendências de informação antes de continuar",
    "Definir prazo de entrega do orçamento",
  ];
}

/**
 * Cria as tarefas escolhidas pelo usuário (HITL).
 * Origem marcada como "sugerida_ia" para rastreabilidade.
 */
export async function criarTarefasSugeridas(
  projetoId: string,
  titulos: string[],
): Promise<void> {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  if (!projetoId || titulos.length === 0) return;

  const { prisma } = await import("@/lib/prisma");

  await Promise.all(
    titulos.map((descricao) =>
      prisma.tarefa.create({
        data: {
          empresaId,
          projetoId,
          descricao,
          status: "aberta",
          origem: "sugerida_ia",
        },
      }),
    ),
  );

  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

