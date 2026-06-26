import { Decimal } from "@prisma/client/runtime/library"
import { prisma } from "@/lib/prisma"

export function listMedicoesByProjeto(empresaId: string, projetoId: string) {
  return prisma.medicao.findMany({
    where: { projetoId, empresaId },
    orderBy: { numero: "asc" },
    take: 50,
    include: {
      itens: {
        include: {
          itemOrcamento: {
            select: { id: true, nome: true, grupo: true, servicos: true, unidade: true, quantidade: true },
          },
        },
      },
    },
  })
}

export async function createMedicao(
  empresaId: string,
  data: { projetoId: string; dataReferencia: Date; observacao?: string },
) {
  const last = await prisma.medicao.findFirst({
    where: { projetoId: data.projetoId, empresaId },
    orderBy: { numero: "desc" },
    select: { numero: true },
  })
  const numero = (last?.numero ?? 0) + 1
  return prisma.medicao.create({
    data: { empresaId, projetoId: data.projetoId, numero, dataReferencia: data.dataReferencia, observacao: data.observacao },
  })
}

export function upsertMedicaoItens(
  medicaoId: string,
  itens: { itemOrcamentoId: string; valorMedido?: number; quantidadeMedida?: number; percentualMedido?: number }[],
) {
  return prisma.$transaction(
    itens.map((item) =>
      prisma.medicaoItem.upsert({
        where: { medicaoId_itemOrcamentoId: { medicaoId, itemOrcamentoId: item.itemOrcamentoId } },
        create: {
          medicaoId,
          itemOrcamentoId: item.itemOrcamentoId,
          valorMedido: item.valorMedido != null ? new Decimal(item.valorMedido) : undefined,
          quantidadeMedida: item.quantidadeMedida != null ? new Decimal(item.quantidadeMedida) : undefined,
          percentualMedido: item.percentualMedido != null ? new Decimal(item.percentualMedido) : undefined,
        },
        update: {
          valorMedido: item.valorMedido != null ? new Decimal(item.valorMedido) : null,
          quantidadeMedida: item.quantidadeMedida != null ? new Decimal(item.quantidadeMedida) : null,
          percentualMedido: item.percentualMedido != null ? new Decimal(item.percentualMedido) : null,
        },
      }),
    ),
  )
}
