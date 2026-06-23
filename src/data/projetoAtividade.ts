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
    where: { projetoId, empresaId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
