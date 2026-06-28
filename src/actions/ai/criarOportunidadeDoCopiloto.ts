"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createCliente } from "@/data/cliente";
import { createAuditEntry } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export type CriarOportunidadeInput = {
  clienteNome: string;
  clienteTelefone?: string;
  clienteTipoPessoa?: string;
  clienteEmail?: string;
  clienteCpfCnpj?: string;
  clienteRazaoSocial?: string;
  clienteRg?: string;
  clienteDataNascimento?: string;
  clienteCep?: string;
  clienteRua?: string;
  clienteNumero?: string;
  clienteComplemento?: string;
  clienteBairro?: string;
  clienteCidade?: string;
  clienteEstado?: string;
  clienteObservacoes?: string;
  titulo: string;
  descricao?: string;
  enderecoObra?: string;
  cepObra?: string;
  logradouroObra?: string;
  numeroEnderecoObra?: string;
  complementoObra?: string;
  bairroObra?: string;
  cidadeObra?: string;
  estadoObra?: string;
  tipoObra?: string;
  origem?: string;
};

export type CriarOportunidadeResult =
  | { ok: true; projetoId: string; clienteId: string }
  | { ok: false; error: string };

export async function criarOportunidadeDoCopiloto(
  input: CriarOportunidadeInput
): Promise<CriarOportunidadeResult> {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const {
    clienteNome,
    clienteTelefone,
    clienteTipoPessoa,
    clienteEmail,
    clienteCpfCnpj,
    clienteRazaoSocial,
    clienteRg,
    clienteDataNascimento,
    clienteCep,
    clienteRua,
    clienteNumero,
    clienteComplemento,
    clienteBairro,
    clienteCidade,
    clienteEstado,
    clienteObservacoes,
    titulo,
    descricao,
    enderecoObra,
    cepObra,
    logradouroObra,
    numeroEnderecoObra,
    complementoObra,
    bairroObra,
    cidadeObra,
    estadoObra,
    tipoObra,
    origem,
  } = input;

  if (!clienteNome?.trim() || clienteNome.trim().length < 2) {
    return { ok: false, error: "Nome do cliente é obrigatório." };
  }
  if (!titulo?.trim()) {
    return { ok: false, error: "Título da oportunidade é obrigatório." };
  }

  try {
    const dataNascimento = clienteDataNascimento && /^\d{4}-\d{2}-\d{2}$/.test(clienteDataNascimento)
      ? new Date(clienteDataNascimento)
      : undefined;
    const tipoPessoa = clienteTipoPessoa === "PJ" || clienteCpfCnpj?.replace(/\D/g, "").length === 14
      ? "PJ"
      : "PF";

    const novoCliente = await createCliente(empresaId, {
      nome: clienteNome.trim(),
      telefone: clienteTelefone?.trim() || undefined,
      tipoPessoa,
      origemContato: "copiloto_ia",
      razaoSocial: clienteRazaoSocial?.trim() || undefined,
      email: clienteEmail?.trim() || undefined,
      cpfCnpj: clienteCpfCnpj?.trim() || undefined,
      cep: clienteCep?.trim() || cepObra?.trim() || undefined,
      rua: clienteRua?.trim() || logradouroObra?.trim() || undefined,
      numero: clienteNumero?.trim() || numeroEnderecoObra?.trim() || undefined,
      complemento: clienteComplemento?.trim() || complementoObra?.trim() || undefined,
      bairro: clienteBairro?.trim() || bairroObra?.trim() || undefined,
      cidade: clienteCidade?.trim() || cidadeObra?.trim() || undefined,
      estado: clienteEstado?.trim() || estadoObra?.trim() || undefined,
      observacoes: clienteObservacoes?.trim() || undefined,
      rg: clienteRg?.trim() || undefined,
      dataNascimento,
    });

    await createAuditEntry({
      empresaId,
      eventoTipo: "validacao_ia",
      entidadeTipo: "cliente",
      entidadeId: novoCliente.id,
      conteudoPersistido: { nome: novoCliente.nome, origem: "copiloto_ia" },
      origemInformacao: "lia:copiloto",
    });

    const novoProjeto = await prisma.projeto.create({
      data: {
        empresaId,
        clienteId: novoCliente.id,
        titulo: titulo.trim().slice(0, 120),
        descricao: descricao?.trim() || undefined,
        stage: "oportunidade",
        statusInterno: "novo",
        origem: origem?.trim() || "copiloto_ia",
        enderecoObra: enderecoObra?.trim() || undefined,
        cepObra: cepObra?.trim() || clienteCep?.trim() || undefined,
        logradouroObra: logradouroObra?.trim() || clienteRua?.trim() || undefined,
        numeroEnderecoObra: numeroEnderecoObra?.trim() || clienteNumero?.trim() || undefined,
        complementoObra: complementoObra?.trim() || clienteComplemento?.trim() || undefined,
        bairroObra: bairroObra?.trim() || clienteBairro?.trim() || undefined,
        cidadeObra: cidadeObra?.trim() || clienteCidade?.trim() || undefined,
        estadoObra: estadoObra?.trim() || clienteEstado?.trim() || undefined,
        tipoObra: tipoObra?.trim() || undefined,
      },
      select: { id: true },
    });

    await createAuditEntry({
      empresaId,
      projetoId: novoProjeto.id,
      eventoTipo: "validacao_ia",
      entidadeTipo: "projeto",
      entidadeId: novoProjeto.id,
      conteudoPersistido: {
        titulo: titulo.trim(),
        stage: "oportunidade",
        statusInterno: "novo",
        clienteId: novoCliente.id,
        origem: origem || "copiloto_ia",
      },
      origemInformacao: "lia:copiloto",
    });

    revalidatePath("/dashboard/projetos");
    revalidatePath("/dashboard");

    return { ok: true, projetoId: novoProjeto.id, clienteId: novoCliente.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar oportunidade.";
    return { ok: false, error: message };
  }
}
