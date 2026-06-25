"use server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createFornecedor, updateFornecedor } from "@/data/fornecedor";
import { createAuditEntry } from "@/lib/audit";

function extractFornecedorFields(formData: FormData) {
  return {
    tipoPessoa:      (formData.get("tipoPessoa") as string) || undefined,
    razaoSocial:     (formData.get("razaoSocial") as string)?.trim() || undefined,
    cpfCnpj:         (formData.get("cpfCnpj") as string)?.trim() || undefined,
    categorias:      (formData.get("categorias") as string)?.trim() || undefined,
    email:           (formData.get("email") as string)?.trim() || undefined,
    telefone:        (formData.get("telefone") as string)?.trim() || undefined,
    site:            (formData.get("site") as string)?.trim() || undefined,
    nomeResponsavel: (formData.get("nomeResponsavel") as string)?.trim() || undefined,
    nomeContato:     (formData.get("nomeContato") as string)?.trim() || undefined,
    cep:             (formData.get("cep") as string)?.trim() || undefined,
    rua:             (formData.get("rua") as string)?.trim() || undefined,
    numero:          (formData.get("numero") as string)?.trim() || undefined,
    complemento:     (formData.get("complemento") as string)?.trim() || undefined,
    bairro:          (formData.get("bairro") as string)?.trim() || undefined,
    cidade:          (formData.get("cidade") as string)?.trim() || undefined,
    estado:          (formData.get("estado") as string)?.trim() || undefined,
  };
}

export async function criarFornecedor(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const nome = (formData.get("nome") as string)?.trim();
  const tipo = (formData.get("tipo") as string) || "servico";

  if (!nome || nome.length < 2) {
    throw new Error("Nome é obrigatório.");
  }

  const fields = extractFornecedorFields(formData);
  const fornecedor = await createFornecedor(empresaId, { nome, tipo, ...fields });

  await createAuditEntry({
    empresaId,
    eventoTipo: "criacao",
    entidadeTipo: "fornecedor",
    entidadeId: fornecedor.id,
    conteudoPersistido: { nome, tipo, email: fields.email, telefone: fields.telefone, cidade: fields.cidade },
  });

  redirect(`/dashboard/fornecedores/${fornecedor.id}`);
}

export async function editarFornecedor(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const fornecedorId = formData.get("fornecedorId") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const tipo = (formData.get("tipo") as string) || "servico";

  if (!fornecedorId || !nome || nome.length < 2) {
    throw new Error("Nome é obrigatório.");
  }

  const fields = extractFornecedorFields(formData);
  const result = await updateFornecedor(empresaId, fornecedorId, { nome, tipo, ...fields });

  if (result.count === 0) throw new Error("Fornecedor não encontrado.");

  await createAuditEntry({
    empresaId,
    eventoTipo: "edicao",
    entidadeTipo: "fornecedor",
    entidadeId: fornecedorId,
    conteudoPersistido: { nome, tipo, email: fields.email, telefone: fields.telefone, cidade: fields.cidade },
  });

  redirect(`/dashboard/fornecedores/${fornecedorId}`);
}
