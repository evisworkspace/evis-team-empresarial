import { prisma } from "@/lib/prisma"

export function listItensOrcamentoPlanejamento(empresaId: string, projetoId: string) {
  return prisma.projetoItemOrcamento.findMany({
    where: { projetoId, empresaId, deletedAt: null, tipo: "composicao" },
    orderBy: [{ posicao: "asc" }, { createdAt: "asc" }],
    take: 500,
    select: {
      id: true, nome: true, grupo: true, unidade: true, quantidade: true,
      servicos: true, posicao: true,
      dataInicioPlano: true, dataFimPlano: true, diasDuracao: true, responsavel: true,
    },
  })
}

export function updateItemPlanejamento(
  empresaId: string,
  id: string,
  data: { dataInicioPlano?: Date | null; dataFimPlano?: Date | null; diasDuracao?: number | null; responsavel?: string | null },
) {
  return prisma.projetoItemOrcamento.updateMany({
    where: { id, empresaId, deletedAt: null },
    data,
  })
}
