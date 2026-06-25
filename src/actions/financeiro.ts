"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createLancamento, createLancamentosParcelados, updateLancamento } from "@/data/financeiro";
import { createAuditEntry } from "@/lib/audit";

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const raw = (value as string | null)?.trim();
  if (!raw) return undefined;
  const parsed = parseFloat(raw);
  return isNaN(parsed) ? undefined : parsed;
}

export async function criarLancamento(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const projetoId = formData.get("projetoId") as string;
  const tipo = formData.get("tipo") as string;
  const descricao = (formData.get("descricao") as string)?.trim() || undefined;
  const categoriaFinanceiraId = (formData.get("categoriaFinanceiraId") as string)?.trim() || undefined;
  const centroDeCustoId = (formData.get("centroDeCustoId") as string)?.trim() || undefined;
  const contaBancaria = (formData.get("contaBancaria") as string)?.trim() || undefined;
  const formaPagamento = (formData.get("formaPagamento") as string)?.trim() || undefined;
  const notaFiscal = (formData.get("notaFiscal") as string)?.trim() || undefined;
  const fornecedorId = (formData.get("fornecedorId") as string)?.trim() || undefined;
  const juros = parseOptionalNumber(formData.get("juros"));
  const multa = parseOptionalNumber(formData.get("multa"));
  const desconto = parseOptionalNumber(formData.get("desconto"));

  if (!projetoId || !tipo) throw new Error("Tipo é obrigatório.");
  if (!["entrada", "saida"].includes(tipo)) throw new Error("Tipo inválido.");

  const nParcelasRaw = parseInt((formData.get("nParcelas") as string) || "1", 10);
  const nParcelas = isNaN(nParcelasRaw) || nParcelasRaw < 1 ? 1 : Math.min(nParcelasRaw, 60);

  if (nParcelas === 1) {
    const valorStr = (formData.get("valor") as string)?.trim();
    const dataVencimentoStr = (formData.get("dataVencimento") as string)?.trim();
    if (!valorStr || !dataVencimentoStr) throw new Error("Valor e data são obrigatórios.");

    const valor = parseFloat(valorStr);
    if (isNaN(valor) || valor <= 0) throw new Error("Valor inválido.");

    const dataVencimento = new Date(dataVencimentoStr);
    if (isNaN(dataVencimento.getTime())) throw new Error("Data inválida.");

    const lancamento = await createLancamento(empresaId, {
      projetoId,
      tipo,
      valor,
      dataVencimento,
      descricao,
      status: "previsto",
      fornecedorId,
      categoriaFinanceiraId,
      centroDeCustoId,
      contaBancaria,
      formaPagamento,
      numeroParcela: 1,
      totalParcelas: 1,
      valorTotal: parseOptionalNumber(formData.get("valorTotal")),
      notaFiscal,
      juros,
      multa,
      desconto,
    });

    await createAuditEntry({
      empresaId,
      projetoId,
      eventoTipo: "alteracao_financeiro",
      entidadeTipo: "lancamento",
      entidadeId: lancamento.id,
      conteudoPersistido: { tipo, valor, descricao },
    });
  } else {
    const valorTotalStr = (formData.get("valorTotal") as string)?.trim();
    if (!valorTotalStr) throw new Error("Valor total é obrigatório.");

    const valorTotal = parseFloat(valorTotalStr);
    if (isNaN(valorTotal) || valorTotal <= 0) throw new Error("Valor total inválido.");

    const parcelas: { dataVencimento: Date; valor: number }[] = [];
    for (let i = 1; i <= nParcelas; i++) {
      const dateStr = (formData.get(`parcela_data_${i}`) as string)?.trim();
      const valorStr = (formData.get(`parcela_valor_${i}`) as string)?.trim();
      if (!dateStr || !valorStr) throw new Error(`Dados da parcela ${i} inválidos.`);

      const d = new Date(dateStr);
      const v = parseFloat(valorStr);
      if (isNaN(d.getTime()) || isNaN(v) || v <= 0) throw new Error(`Parcela ${i} inválida.`);

      parcelas.push({ dataVencimento: d, valor: v });
    }

    await createLancamentosParcelados(empresaId, {
      projetoId,
      tipo,
      descricao,
      status: "previsto",
      fornecedorId,
      categoriaFinanceiraId,
      centroDeCustoId,
      contaBancaria,
      formaPagamento,
      valorTotal,
      notaFiscal,
      juros,
      multa,
      desconto,
    }, parcelas);
  }

  revalidatePath(`/dashboard/projetos/${projetoId}`);
  revalidatePath(`/dashboard/financeiro`);
}

export async function marcarLancamentoPago(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const lancamentoId = formData.get("lancamentoId") as string;
  const projetoId = formData.get("projetoId") as string;
  const tipo = formData.get("tipo") as string;

  if (!lancamentoId || !projetoId) throw new Error("Dados obrigatórios.");

  const novoStatus = tipo === "entrada" ? "recebido" : "pago";

  const result = await updateLancamento(empresaId, lancamentoId, {
    status: novoStatus,
    dataRealizacao: new Date(),
  });

  if (result.count === 0) throw new Error("Lançamento não encontrado.");

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "alteracao_financeiro",
    entidadeTipo: "lancamento",
    entidadeId: lancamentoId,
    conteudoPersistido: { novoStatus },
  });

  revalidatePath(`/dashboard/projetos/${projetoId}`);
  revalidatePath(`/dashboard/financeiro`);
}
