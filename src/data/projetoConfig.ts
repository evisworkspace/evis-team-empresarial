import { prisma } from "@/lib/prisma"

export function getProjetoConfig(empresaId: string, projetoId: string) {
  return prisma.projetoConfig.findUnique({
    where: { projetoId },
    select: { bdiPadraoP: true, bdiPadraoS: true },
  })
}
