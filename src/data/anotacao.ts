import { prisma } from "@/lib/prisma";

export function listAnotacoesByProjeto(empresaId: string, projetoId: string) {
  return prisma.anotacao.findMany({
    where: { empresaId, projetoId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export function createAnotacao(
  empresaId: string,
  data: { projetoId: string; titulo?: string; conteudo: string },
) {
  return prisma.anotacao.create({ data: { empresaId, ...data } });
}

export function updateAnotacao(
  empresaId: string,
  anotacaoId: string,
  data: { titulo?: string; conteudo?: string; visivelCliente?: boolean },
) {
  return prisma.anotacao.updateMany({
    where: { id: anotacaoId, empresaId, deletedAt: null },
    data,
  });
}

export function deleteAnotacao(empresaId: string, anotacaoId: string) {
  return prisma.anotacao.updateMany({
    where: { id: anotacaoId, empresaId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
