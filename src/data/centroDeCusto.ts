import { prisma } from "@/lib/prisma"

export function listCentrosByEmpresa(empresaId: string, opts?: { take?: number }) {
  return prisma.centroDeCusto.findMany({
    where: { empresaId, deletedAt: null },
    orderBy: { nome: "asc" },
    take: opts?.take ?? 200,
  })
}

export const listCentrosCustoByEmpresa = listCentrosByEmpresa

export function createCentroDeCusto(empresaId: string, data: { nome: string }) {
  return prisma.centroDeCusto.create({ data: { empresaId, ...data } })
}

export function updateCentroDeCusto(
  empresaId: string,
  id: string,
  data: { nome?: string; ativo?: boolean },
) {
  return prisma.centroDeCusto.updateMany({ where: { id, empresaId, deletedAt: null }, data })
}

export function deleteCentroDeCusto(empresaId: string, id: string) {
  return prisma.centroDeCusto.updateMany({
    where: { id, empresaId },
    data: { deletedAt: new Date() },
  })
}
