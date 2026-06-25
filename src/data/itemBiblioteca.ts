import { prisma } from "@/lib/prisma"

const INCLUDE = {
  unidade:   { select: { id: true, nome: true } },
  grupo:     { select: { id: true, nome: true } },
  categoria: { select: { id: true, nome: true } },
} as const

export function listItensByEmpresa(
  empresaId: string,
  opts?: { tipo?: string; q?: string },
) {
  return prisma.itemBiblioteca.findMany({
    where: {
      empresaId,
      deletedAt: null,
      ...(opts?.tipo ? { tipo: opts.tipo } : {}),
      ...(opts?.q
        ? {
            OR: [
              { nome: { contains: opts.q, mode: "insensitive" } },
              { codigo: { contains: opts.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { nome: "asc" },
    take: 100,
    include: INCLUDE,
  })
}

export function getItemBiblioteca(empresaId: string, id: string) {
  return prisma.itemBiblioteca.findFirst({
    where: { id, empresaId, deletedAt: null },
    include: INCLUDE,
  })
}

export function createItemBiblioteca(
  empresaId: string,
  data: {
    nome: string
    tipo: string
    codigo?: string
    descricao?: string
    precoUnitario?: number
    unidadeId?: string
    grupoId?: string
    categoriaId?: string
  },
) {
  return prisma.itemBiblioteca.create({ data: { empresaId, ...data } })
}

export function updateItemBiblioteca(
  empresaId: string,
  id: string,
  data: {
    nome?: string
    tipo?: string
    codigo?: string | null
    descricao?: string | null
    precoUnitario?: number | null
    unidadeId?: string | null
    grupoId?: string | null
    categoriaId?: string | null
    ativo?: boolean
  },
) {
  return prisma.itemBiblioteca.updateMany({
    where: { id, empresaId, deletedAt: null },
    data,
  })
}

export function deleteItemBiblioteca(empresaId: string, id: string) {
  return prisma.itemBiblioteca.updateMany({
    where: { id, empresaId },
    data: { deletedAt: new Date() },
  })
}
