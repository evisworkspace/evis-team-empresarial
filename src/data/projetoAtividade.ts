import { prisma } from "@/lib/prisma";

export function createAtividade(
  empresaId: string,
  data: { projetoId: string; tipo: string; descricao: string },
) {
  return prisma.projetoAtividade.create({
    data: {
      empresaId,
      projetoId: data.projetoId,
      tipo: data.tipo,
      descricao: data.descricao,
    },
  });
}

export function listAtividadesByProjeto(empresaId: string, projetoId: string) {
  return prisma.projetoAtividade.findMany({
    where: { projetoId, empresaId, projeto: { deletedAt: null } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export function editAtividade(
  empresaId: string,
  atividadeId: string,
  data: { descricao: string },
) {
  return prisma.projetoAtividade.updateMany({
    where: { id: atividadeId, empresaId },
    data,
  });
}

export function deleteAtividade(empresaId: string, atividadeId: string) {
  return prisma.projetoAtividade.deleteMany({
    where: { id: atividadeId, empresaId },
  });
}

export function listAtividadesGlobais(empresaId: string, take = 100) {
  return prisma.projetoAtividade.findMany({
    where: { empresaId, projeto: { deletedAt: null } },
    include: {
      projeto: { select: { id: true, titulo: true, stage: true, codigoSequencial: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
