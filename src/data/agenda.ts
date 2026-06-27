import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 50;

export function createAgendaItem(
  empresaId: string,
  data: {
    projetoId?: string | null;
    titulo: string;
    descricao?: string | null;
    tipo?: string;
    inicio: Date;
    fim?: Date | null;
    status?: string;
    origem?: string;
  },
) {
  return prisma.agendaItem.create({
    data: {
      empresaId,
      projetoId: data.projetoId || null,
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      tipo: data.tipo ?? "compromisso",
      inicio: data.inicio,
      fim: data.fim ?? null,
      status: data.status ?? "agendado",
      origem: data.origem ?? "manual",
    },
  });
}

export function listAgendaByEmpresa(
  empresaId: string,
  opts?: {
    projetoId?: string;
    from?: Date;
    to?: Date;
    status?: string;
    take?: number;
  },
) {
  return prisma.agendaItem.findMany({
    where: {
      empresaId,
      deletedAt: null,
      ...(opts?.projetoId ? { projetoId: opts.projetoId } : {}),
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.from || opts?.to
        ? {
            inicio: {
              ...(opts.from ? { gte: opts.from } : {}),
              ...(opts.to ? { lt: opts.to } : {}),
            },
          }
        : {}),
      OR: [
        { projetoId: null },
        { projeto: { deletedAt: null } },
      ],
    },
    include: {
      projeto: { select: { id: true, titulo: true, stage: true, codigoSequencial: true } },
    },
    orderBy: { inicio: "asc" },
    take: opts?.take ?? DEFAULT_PAGE_SIZE,
  });
}

export function countAgendaByEmpresa(
  empresaId: string,
  opts?: { from?: Date; to?: Date; status?: string },
) {
  return prisma.agendaItem.count({
    where: {
      empresaId,
      deletedAt: null,
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.from || opts?.to
        ? {
            inicio: {
              ...(opts.from ? { gte: opts.from } : {}),
              ...(opts.to ? { lt: opts.to } : {}),
            },
          }
        : {}),
    },
  });
}
