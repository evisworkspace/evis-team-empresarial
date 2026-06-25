import { prisma } from "@/lib/prisma"

export async function getUsuarioByAuthId(authUserId: string, empresaId: string) {
  return prisma.usuario.findFirst({
    where: { authUserId, empresaId, deletedAt: null },
    include: { authUser: { select: { name: true, email: true, image: true } } },
  })
}

export async function getEmpresaCompleta(empresaId: string) {
  return prisma.empresa.findFirst({
    where: { id: empresaId, deletedAt: null },
  })
}

export async function getMembros(empresaId: string) {
  return prisma.usuario.findMany({
    where: { empresaId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 50,
  })
}

export async function getConviteByToken(token: string) {
  return prisma.conviteEquipe.findUnique({
    where: { token },
    include: { empresa: { select: { id: true, nome: true } } },
  })
}
