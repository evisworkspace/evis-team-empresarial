import { prisma } from "@/lib/prisma"

export function listCategoriasFinanceirasByEmpresa(
  empresaId: string,
  opts?: { tipo?: string; take?: number },
) {
  return prisma.categoriaFinanceira.findMany({
    where: {
      empresaId,
      deletedAt: null,
      ...(opts?.tipo ? { tipo: opts.tipo } : {}),
    },
    orderBy: [{ numero: "asc" }, { nome: "asc" }],
    take: opts?.take ?? 200,
    include: {
      parent: { select: { id: true, nome: true, numero: true } },
    },
  })
}

export const listCategoriasByEmpresa = listCategoriasFinanceirasByEmpresa

export function createCategoriaFinanceira(
  empresaId: string,
  data: {
    nome: string
    numero: string
    tipo: string
    grupoDRE?: string
    parentId?: string
  },
) {
  return prisma.categoriaFinanceira.create({ data: { empresaId, ...data } })
}

export function updateCategoriaFinanceira(
  empresaId: string,
  id: string,
  data: {
    nome?: string
    numero?: string
    tipo?: string
    grupoDRE?: string
    parentId?: string | null
    ativo?: boolean
  },
) {
  return prisma.categoriaFinanceira.updateMany({
    where: { id, empresaId, deletedAt: null },
    data,
  })
}

export function deleteCategoriaFinanceira(empresaId: string, id: string) {
  return prisma.categoriaFinanceira.updateMany({
    where: { id, empresaId },
    data: { deletedAt: new Date() },
  })
}
