"use server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createFornecedor, updateFornecedor } from "@/data/fornecedor";
import { createAuditEntry } from "@/lib/audit";

export async function criarFornecedor(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const nome = (formData.get("nome") as string)?.trim();
  const contato = (formData.get("contato") as string)?.trim() || undefined;
  const tipo = (formData.get("tipo") as string) || "servico";

  if (!nome || nome.length < 2) {
    throw new Error("Nome é obrigatório.");
  }

  const fornecedor = await createFornecedor(empresaId, { nome, contato, tipo });

  await createAuditEntry({
    empresaId,
    eventoTipo: "criacao",
    entidadeTipo: "fornecedor",
    entidadeId: fornecedor.id,
    conteudoPersistido: { nome, tipo },
  });

  redirect(`/dashboard/fornecedores/${fornecedor.id}`);
}

export async function editarFornecedor(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const fornecedorId = formData.get("fornecedorId") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const contato = (formData.get("contato") as string)?.trim() || null;
  const tipo = (formData.get("tipo") as string) || "servico";

  if (!fornecedorId || !nome || nome.length < 2) {
    throw new Error("Nome é obrigatório.");
  }

  const result = await updateFornecedor(empresaId, fornecedorId, { nome, contato, tipo });

  if (result.count === 0) throw new Error("Fornecedor não encontrado.");

  await createAuditEntry({
    empresaId,
    eventoTipo: "edicao",
    entidadeTipo: "fornecedor",
    entidadeId: fornecedorId,
    conteudoPersistido: { nome, tipo },
  });

  redirect(`/dashboard/fornecedores/${fornecedorId}`);
}
