import { prisma } from "@/lib/prisma"

export function listUnidadesByEmpresa(empresaId: string) {
  return prisma.unidadeMedida.findMany({
    where: { empresaId, deletedAt: null },
    orderBy: { nome: "asc" },
    take: 200,
  })
}

export function createUnidadeMedida(empresaId: string, data: { nome: string }) {
  return prisma.unidadeMedida.create({ data: { empresaId, ...data } })
}

export function updateUnidadeMedida(
  empresaId: string,
  id: string,
  data: { nome?: string; ativo?: boolean },
) {
  return prisma.unidadeMedida.updateMany({ where: { id, empresaId, deletedAt: null }, data })
}

export function deleteUnidadeMedida(empresaId: string, id: string) {
  return prisma.unidadeMedida.updateMany({
    where: { id, empresaId },
    data: { deletedAt: new Date() },
  })
}
