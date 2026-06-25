import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

export function listLancamentosByProjeto(
  empresaId: string,
  projetoId: string,
  opts?: { take?: number },
) {
  return prisma.lancamentoFinanceiro.findMany({
    where: { empresaId, projetoId, deletedAt: null },
    include: {
      categoriaFinanceira: { select: { id: true, nome: true } },
      centroDeCusto: { select: { id: true, nome: true } },
      fornecedor: { select: { id: true, nome: true } },
    },
    orderBy: { dataVencimento: "asc" },
    take: opts?.take ?? 100,
  });
}

export function listLancamentosByEmpresa(
  empresaId: string,
  opts?: { tipo?: string; categoriaId?: string; take?: number; skip?: number },
) {
  return prisma.lancamentoFinanceiro.findMany({
    where: {
      empresaId,
      deletedAt: null,
      ...(opts?.tipo ? { tipo: opts.tipo } : {}),
      ...(opts?.categoriaId ? { categoriaFinanceiraId: opts.categoriaId } : {}),
    },
    include: {
      projeto: { select: { id: true, titulo: true } },
      categoriaFinanceira: { select: { id: true, nome: true } },
      centroDeCusto: { select: { id: true, nome: true } },
      fornecedor: { select: { id: true, nome: true } },
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
    fornecedorId?: string;
    categoriaFinanceiraId?: string;
    centroDeCustoId?: string;
    contaBancaria?: string;
    formaPagamento?: string;
    numeroParcela?: number;
    totalParcelas?: number;
    valorTotal?: number;
    notaFiscal?: string;
    juros?: number;
    multa?: number;
    desconto?: number;
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
      fornecedorId: data.fornecedorId,
      categoriaFinanceiraId: data.categoriaFinanceiraId,
      centroDeCustoId: data.centroDeCustoId,
      contaBancaria: data.contaBancaria,
      formaPagamento: data.formaPagamento,
      numeroParcela: data.numeroParcela,
      totalParcelas: data.totalParcelas,
      valorTotal: data.valorTotal != null ? new Decimal(data.valorTotal) : undefined,
      notaFiscal: data.notaFiscal,
      juros: data.juros != null ? new Decimal(data.juros) : undefined,
      multa: data.multa != null ? new Decimal(data.multa) : undefined,
      desconto: data.desconto != null ? new Decimal(data.desconto) : undefined,
    },
  });
}

export async function createLancamentosParcelados(
  empresaId: string,
  base: Omit<Parameters<typeof createLancamento>[1], "numeroParcela" | "totalParcelas" | "dataVencimento" | "valor">,
  parcelas: { dataVencimento: Date; valor: number }[],
) {
  const total = parcelas.length;
  const results = [];

  for (let i = 0; i < total; i++) {
    const r = await createLancamento(empresaId, {
      ...base,
      valor: parcelas[i].valor,
      dataVencimento: parcelas[i].dataVencimento,
      numeroParcela: i + 1,
      totalParcelas: total,
    });
    results.push(r);
  }

  return results;
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
