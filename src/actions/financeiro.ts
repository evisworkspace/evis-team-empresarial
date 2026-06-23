"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createLancamento, updateLancamento } from "@/data/financeiro";
import { createAuditEntry } from "@/lib/audit";

export async function criarLancamento(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const projetoId = formData.get("projetoId") as string;
  const tipo = formData.get("tipo") as string;
  const valorStr = (formData.get("valor") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim() || undefined;
  const dataVencimentoStr = (formData.get("dataVencimento") as string)?.trim();

  if (!projetoId || !tipo || !valorStr || !dataVencimentoStr) {
    throw new Error("Tipo, valor e data são obrigatórios.");
  }

  const valor = parseFloat(valorStr);
  if (isNaN(valor) || valor <= 0) throw new Error("Valor inválido.");

  const dataVencimento = new Date(dataVencimentoStr);
  if (isNaN(dataVencimento.getTime())) throw new Error("Data inválida.");

  if (!["entrada", "saida"].includes(tipo)) throw new Error("Tipo inválido.");

  const lancamento = await createLancamento(empresaId, {
    projetoId,
    tipo,
    valor,
    dataVencimento,
    descricao,
    status: "previsto",
  });

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "alteracao_financeiro",
    entidadeTipo: "lancamento",
    entidadeId: lancamento.id,
    conteudoPersistido: { tipo, valor, descricao },
  });

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
