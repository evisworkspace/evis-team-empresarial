import { prisma } from "@/lib/prisma";

export function listDiariosDeObra(empresaId: string, projetoId: string) {
  return prisma.diarioDeObra.findMany({
    where: { empresaId, projetoId },
    orderBy: { data: "desc" },
    take: 20,
    include: {
      itensHITL: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getNextNumero(empresaId: string, projetoId: string) {
  const last = await prisma.diarioDeObra.findFirst({
    where: { empresaId, projetoId },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  return (last?.numero ?? 0) + 1;
}

export function createDiario(
  empresaId: string,
  data: { projetoId: string; numero: number; data: Date; descricao: string }
) {
  return prisma.diarioDeObra.create({
    data: { empresaId, ...data },
  });
}

export function createItensHITL(
  diarioId: string,
  empresaId: string,
  itens: Array<{
    tipo: string;
    titulo: string;
    descricao?: string;
    prioridade?: string;
    percentual?: number;
    dataSugerida?: Date;
    confianca?: number;
    motivoDeteccao?: string;
  }>
) {
  if (itens.length === 0) return Promise.resolve();
  return prisma.diarioItemHITL.createMany({
    data: itens.map((i) => ({
      diarioId,
      empresaId,
      tipo: i.tipo,
      titulo: i.titulo,
      descricao: i.descricao,
      prioridade: i.prioridade,
      percentual: i.percentual,
      dataSugerida: i.dataSugerida,
      confianca: i.confianca ?? 0.8,
      motivoDeteccao: i.motivoDeteccao,
    })),
  });
}

export function updateItemHITLStatus(
  empresaId: string,
  itemId: string,
  status: "aprovado" | "rejeitado"
) {
  return prisma.diarioItemHITL.updateMany({
    where: { id: itemId, empresaId },
    data: { status },
  });
}

export function updateDiarioStatus(
  empresaId: string,
  diarioId: string,
  status: "rascunho" | "processando" | "concluido",
  processado?: boolean
) {
  return prisma.diarioDeObra.updateMany({
    where: { id: diarioId, empresaId },
    data: { status, ...(processado !== undefined ? { processado } : {}) },
  });
}
