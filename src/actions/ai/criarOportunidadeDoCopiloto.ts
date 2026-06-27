"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createCliente } from "@/data/cliente";
import { createTarefa } from "@/data/tarefa";
import { createAuditEntry } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export type CriarOportunidadeInput = {
  clienteNome: string;
  clienteTelefone?: string;
  titulo: string;
  descricao?: string;
  enderecoObra?: string;
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

  const { clienteNome, clienteTelefone, titulo, descricao, enderecoObra, tipoObra, origem } = input;

  if (!clienteNome?.trim() || clienteNome.trim().length < 2) {
    return { ok: false, error: "Nome do cliente é obrigatório." };
  }
  if (!titulo?.trim()) {
    return { ok: false, error: "Título da oportunidade é obrigatório." };
  }

  try {
    const novoCliente = await createCliente(empresaId, {
      nome: clienteNome.trim(),
      telefone: clienteTelefone?.trim() || undefined,
      origemContato: "copiloto_ia",
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

    // Tarefas padrão para nova oportunidade (mesmo padrão do criarProjeto)
    await createTarefa(empresaId, {
      projetoId: novoProjeto.id,
      descricao: "Confirmar escopo e expectativas com o cliente",
      status: "aberta",
      origem: "sugerida_ia",
    });
    await createTarefa(empresaId, {
      projetoId: novoProjeto.id,
      descricao: "Iniciar pré-orçamento com base nos dados recebidos",
      status: "aberta",
      origem: "sugerida_ia",
    });

    revalidatePath("/dashboard/projetos");
    revalidatePath("/dashboard");

    return { ok: true, projetoId: novoProjeto.id, clienteId: novoCliente.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar oportunidade.";
    return { ok: false, error: message };
  }
}
