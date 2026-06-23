// Camada de dados — Empresa.
// Somente leitura do tenant raiz. Nunca cria empresa aqui (onboarding cuida disso).
import { prisma } from "@/lib/prisma";

export function getEmpresaById(empresaId: string) {
  return prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nome: true, status: true, tipoPessoa: true },
  });
}
