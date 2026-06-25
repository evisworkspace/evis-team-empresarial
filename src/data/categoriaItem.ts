import { prisma } from "@/lib/prisma"

export function listCategoriasByEmpresa(empresaId: string) {
  return prisma.categoriaItem.findMany({
    where: { empresaId, deletedAt: null },
    orderBy: { nome: "asc" },
    take: 200,
  })
}

export function createCategoriaItem(empresaId: string, data: { nome: string }) {
  return prisma.categoriaItem.create({ data: { empresaId, ...data } })
}

export function updateCategoriaItem(
  empresaId: string,
  id: string,
  data: { nome?: string; ativo?: boolean },
) {
  return prisma.categoriaItem.updateMany({ where: { id, empresaId, deletedAt: null }, data })
}

export function deleteCategoriaItem(empresaId: string, id: string) {
  return prisma.categoriaItem.updateMany({
    where: { id, empresaId },
    data: { deletedAt: new Date() },
  })
}
