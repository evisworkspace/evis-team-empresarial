import { prisma } from "@/lib/prisma"

export function listGruposByEmpresa(empresaId: string) {
  return prisma.grupoItem.findMany({
    where: { empresaId, deletedAt: null },
    orderBy: { nome: "asc" },
    take: 200,
  })
}

export function createGrupoItem(empresaId: string, data: { nome: string }) {
  return prisma.grupoItem.create({ data: { empresaId, ...data } })
}

export function updateGrupoItem(
  empresaId: string,
  id: string,
  data: { nome?: string; ativo?: boolean },
) {
  return prisma.grupoItem.updateMany({ where: { id, empresaId, deletedAt: null }, data })
}

export function deleteGrupoItem(empresaId: string, id: string) {
  return prisma.grupoItem.updateMany({ where: { id, empresaId }, data: { deletedAt: new Date() } })
}
