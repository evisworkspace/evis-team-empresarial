import { prisma } from "@/lib/prisma"

export function listItensOrcamentoByProjeto(empresaId: string, projetoId: string) {
  return prisma.projetoItemOrcamento.findMany({
    where: { projetoId, empresaId, deletedAt: null },
    orderBy: [{ posicao: "asc" }, { createdAt: "asc" }],
    take: 500,
    include: {
      itemBiblioteca: { select: { id: true, nome: true, codigo: true } },
    },
  })
}

export function createItemOrcamento(
  empresaId: string,
  data: {
    projetoId: string
    tipo: string
    nome: string
    parentId?: string
    posicao?: number
    grupo?: string
    itemBibliotecaId?: string
    unidade?: string
    quantidade?: number
    custoServicos?: number
    bdi?: number
    produtos?: number
    servicos?: number
  },
) {
  return prisma.projetoItemOrcamento.create({
    data: { empresaId, ...data },
  })
}

export function updateItemOrcamento(
  empresaId: string,
  id: string,
  data: {
    nome?: string
    grupo?: string | null
    unidade?: string | null
    quantidade?: number | null
    custoServicos?: number | null
    bdi?: number | null
    produtos?: number | null
    servicos?: number | null
    itemBibliotecaId?: string | null
    posicao?: number
  },
) {
  return prisma.projetoItemOrcamento.updateMany({
    where: { id, empresaId, deletedAt: null },
    data,
  })
}

export function deleteItemOrcamento(empresaId: string, id: string) {
  return prisma.projetoItemOrcamento.updateMany({
    where: { id, empresaId },
    data: { deletedAt: new Date() },
  })
}

export function sumOrcamentoByProjeto(empresaId: string, projetoId: string) {
  return prisma.projetoItemOrcamento.aggregate({
    where: {
      projetoId,
      empresaId,
      deletedAt: null,
      tipo: "composicao",
    },
    _sum: { servicos: true },
  })
}
