import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

export function listLancamentosByProjeto(
  empresaId: string,
  projetoId: string,
  opts?: { take?: number },
) {
  return prisma.lancamentoFinanceiro.findMany({
    where: { empresaId, projetoId, deletedAt: null },
    orderBy: { dataVencimento: "asc" },
    take: opts?.take ?? 20,
  });
}

export function listLancamentosByEmpresa(
  empresaId: string,
  opts?: { tipo?: string; take?: number; skip?: number },
) {
  return prisma.lancamentoFinanceiro.findMany({
    where: {
      empresaId,
      deletedAt: null,
      ...(opts?.tipo ? { tipo: opts.tipo } : {}),
    },
    include: {
      projeto: { select: { id: true, titulo: true } },
    },
    orderBy: { dataVencimento: "desc" },
    take: opts?.take ?? 50,
    skip: opts?.skip ?? 0,
  });
}

export async function sumLancamentosByEmpresa(empresaId: string) {
  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    where: { empresaId, deletedAt: null, status: { not: "cancelado" } },
    select: { tipo: true, valor: true },
  });

  let totalEntrada = 0;
  let totalSaida = 0;

  for (const l of lancamentos) {
    const v = Number(l.valor);
    if (l.tipo === "entrada") totalEntrada += v;
    else totalSaida += v;
  }

  return { totalEntrada, totalSaida, saldo: totalEntrada - totalSaida };
}

export function updateLancamento(
  empresaId: string,
  lancamentoId: string,
  data: { status?: string; dataRealizacao?: Date | null },
) {
  return prisma.lancamentoFinanceiro.updateMany({
    where: { id: lancamentoId, empresaId, deletedAt: null },
    data,
  });
}

export function createLancamento(
  empresaId: string,
  data: {
    projetoId: string;
    tipo: string;
    valor: number;
    dataVencimento: Date;
    descricao?: string;
    status?: string;
  },
) {
  return prisma.lancamentoFinanceiro.create({
    data: {
      empresaId,
      projetoId: data.projetoId,
      tipo: data.tipo,
      valor: new Decimal(data.valor),
      dataVencimento: data.dataVencimento,
      descricao: data.descricao,
      status: data.status ?? "previsto",
    },
  });
}

export async function sumLancamentosByProjeto(
  empresaId: string,
  projetoId: string,
) {
  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    where: { empresaId, projetoId, deletedAt: null, status: { not: "cancelado" } },
    select: { tipo: true, valor: true },
  });

  let totalEntrada = 0;
  let totalSaida = 0;

  for (const l of lancamentos) {
    const v = Number(l.valor);
    if (l.tipo === "entrada") totalEntrada += v;
    else totalSaida += v;
  }

  return { totalEntrada, totalSaida, saldo: totalEntrada - totalSaida };
}
