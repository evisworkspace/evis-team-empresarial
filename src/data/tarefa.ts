import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 50;

export function listTarefasByEmpresa(
  empresaId: string,
  opts?: { status?: string; take?: number; skip?: number },
) {
  return prisma.tarefa.findMany({
    where: {
      empresaId,
      deletedAt: null,
      projeto: { deletedAt: null },
      ...(opts?.status ? { status: opts.status } : {}),
    },
    include: {
      projeto: { select: { id: true, titulo: true, stage: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? DEFAULT_PAGE_SIZE,
    skip: opts?.skip ?? 0,
  });
}

export function listTarefasByProjeto(
  empresaId: string,
  projetoId: string,
  opts?: { status?: string; take?: number },
) {
  return prisma.tarefa.findMany({
    where: {
      empresaId,
      projetoId,
      deletedAt: null,
      ...(opts?.status ? { status: opts.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 30,
  });
}

export function countTarefasByEmpresa(empresaId: string, status?: string) {
  return prisma.tarefa.count({
    where: {
      empresaId,
      deletedAt: null,
      ...(status ? { status } : {}),
    },
  });
}

export function countOverdueTarefasByEmpresa(empresaId: string) {
  return prisma.tarefa.count({
    where: {
      empresaId,
      deletedAt: null,
      dataPrevista: { lt: new Date() },
      status: { notIn: ["concluida", "cancelada"] },
    },
  });
}

export async function updateTarefa(
  empresaId: string,
  tarefaId: string,
  data: { status?: string },
) {
  return prisma.tarefa.updateMany({
    where: { id: tarefaId, empresaId, deletedAt: null },
    data,
  });
}

export function createTarefa(
  empresaId: string,
  data: {
    projetoId: string;
    descricao: string;
    dataPrevista?: Date;
    status?: string;
    origem?: string;
  },
) {
  return prisma.tarefa.create({
    data: {
      empresaId,
      projetoId: data.projetoId,
      descricao: data.descricao,
      dataPrevista: data.dataPrevista,
      status: data.status ?? "aberta",
      origem: data.origem ?? "manual",
    },
  });
}

export function editTarefa(
  empresaId: string,
  tarefaId: string,
  data: { descricao: string; dataPrevista?: Date | null },
) {
  return prisma.tarefa.updateMany({
    where: { id: tarefaId, empresaId, deletedAt: null },
    data,
  });
}

export function deleteTarefa(empresaId: string, tarefaId: string) {
  return prisma.tarefa.updateMany({
    where: { id: tarefaId, empresaId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
