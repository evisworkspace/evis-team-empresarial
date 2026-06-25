"use server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createCliente, updateCliente, deleteCliente } from "@/data/cliente";
import { createAuditEntry } from "@/lib/audit";

export async function criarCliente(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const nome = (formData.get("nome") as string)?.trim();
  const telefone = (formData.get("telefone") as string)?.trim() || undefined;
  const tipoPessoa = (formData.get("tipoPessoa") as string) || "PF";
  const origemContato = (formData.get("origemContato") as string)?.trim() || undefined;
  const razaoSocial = (formData.get("razaoSocial") as string)?.trim() || undefined;
  const email = (formData.get("email") as string)?.trim() || undefined;
  const cpfCnpj = (formData.get("cpfCnpj") as string)?.trim() || undefined;
  const cep = (formData.get("cep") as string)?.trim() || undefined;
  const rua = (formData.get("rua") as string)?.trim() || undefined;
  const numero = (formData.get("numero") as string)?.trim() || undefined;
  const complemento = (formData.get("complemento") as string)?.trim() || undefined;
  const bairro = (formData.get("bairro") as string)?.trim() || undefined;
  const cidade = (formData.get("cidade") as string)?.trim() || undefined;
  const estado = (formData.get("estado") as string)?.trim() || undefined;
  const observacoes = (formData.get("observacoes") as string)?.trim() || undefined;
  const rg = (formData.get("rg") as string)?.trim() || undefined;
  const dataNascimentoRaw = (formData.get("dataNascimento") as string) || null;
  const dataNascimento = dataNascimentoRaw ? new Date(dataNascimentoRaw) : undefined;

  if (!nome || nome.length < 2) {
    throw new Error("Nome é obrigatório.");
  }

  const cliente = await createCliente(empresaId, {
    nome, telefone, tipoPessoa, origemContato,
    razaoSocial, email, cpfCnpj, cep, rua, numero, complemento, bairro, cidade, estado, observacoes,
    rg, dataNascimento,
  });

  await createAuditEntry({
    empresaId,
    eventoTipo: "criacao",
    entidadeTipo: "cliente",
    entidadeId: cliente.id,
    conteudoPersistido: { nome, tipoPessoa },
  });

  const redirectToRaw = (formData.get("redirectTo") as string)?.trim();
  const destination = redirectToRaw
    ? `${redirectToRaw}${redirectToRaw.includes("?") ? "&" : "?"}clienteId=${cliente.id}`
    : `/dashboard/clientes/${cliente.id}`;
  redirect(destination);
}

export async function editarCliente(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const clienteId = formData.get("clienteId") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const telefone = (formData.get("telefone") as string)?.trim() || null;
  const tipoPessoa = (formData.get("tipoPessoa") as string) || "PF";
  const origemContato = (formData.get("origemContato") as string)?.trim() || null;
  const razaoSocial = (formData.get("razaoSocial") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const cpfCnpj = (formData.get("cpfCnpj") as string)?.trim() || null;
  const cep = (formData.get("cep") as string)?.trim() || null;
  const rua = (formData.get("rua") as string)?.trim() || null;
  const numero = (formData.get("numero") as string)?.trim() || null;
  const complemento = (formData.get("complemento") as string)?.trim() || null;
  const bairro = (formData.get("bairro") as string)?.trim() || null;
  const cidade = (formData.get("cidade") as string)?.trim() || null;
  const estado = (formData.get("estado") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;
  const rg = (formData.get("rg") as string)?.trim() || null;
  const dataNascimentoRaw = (formData.get("dataNascimento") as string) || null;
  const dataNascimento = dataNascimentoRaw ? new Date(dataNascimentoRaw) : null;

  if (!clienteId || !nome || nome.length < 2) {
    throw new Error("Nome é obrigatório.");
  }

  const result = await updateCliente(empresaId, clienteId, {
    nome, telefone, tipoPessoa, origemContato,
    razaoSocial, email, cpfCnpj, cep, rua, numero, complemento, bairro, cidade, estado, observacoes,
    rg, dataNascimento,
  });

  if (result.count === 0) throw new Error("Cliente não encontrado.");

  await createAuditEntry({
    empresaId,
    eventoTipo: "edicao",
    entidadeTipo: "cliente",
    entidadeId: clienteId,
    conteudoPersistido: { nome, tipoPessoa },
  });

  redirect(`/dashboard/clientes/${clienteId}`);
}

export async function excluirCliente(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const clienteId = formData.get("clienteId") as string;

  if (!clienteId) throw new Error("ID do cliente obrigatório.");

  const result = await deleteCliente(empresaId, clienteId);
  if (result.count === 0) throw new Error("Cliente não encontrado.");

  await createAuditEntry({
    empresaId,
    eventoTipo: "edicao",
    entidadeTipo: "cliente",
    entidadeId: clienteId,
    conteudoPersistido: { acao: "exclusao_soft" },
  });

  redirect("/dashboard/clientes");
}
