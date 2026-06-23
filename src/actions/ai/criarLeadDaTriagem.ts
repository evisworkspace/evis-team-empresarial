"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createCliente } from "@/data/cliente";
import { createAuditEntry } from "@/lib/audit";

export type CriarLeadInput = {
  nome: string;
  telefone: string;
  narrativa: string;
};

export type CriarLeadResult =
  | { ok: true; projetoId: string }
  | { ok: false; error: string };

export async function criarLeadDaTriagem(input: CriarLeadInput): Promise<CriarLeadResult> {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const { nome, telefone, narrativa } = input;

  if (!nome || nome.trim().length < 2) {
    return { ok: false, error: "Nome do cliente é obrigatório." };
  }

  try {
    const novoCliente = await createCliente(empresaId, {
      nome: nome.trim(),
      telefone: telefone.trim() || undefined,
      origemContato: "triagem_ia",
    });

    await createAuditEntry({
      empresaId,
      eventoTipo: "validacao_ia",
      entidadeTipo: "cliente",
      entidadeId: novoCliente.id,
      conteudoPersistido: { nome: novoCliente.nome, origem: "triagem_ia" },
      origemInformacao: "lia:triagem_whatsapp",
    });

    const titulo = narrativa.trim().slice(0, 80) || `Lead - ${nome.trim()}`;

    const novoProjeto = await prisma.projeto.create({
      data: {
        empresaId,
        clienteId: novoCliente.id,
        titulo,
        descricao: narrativa.trim() || undefined,
        stage: "oportunidade",
        statusInterno: "novo",
        origem: "triagem_ia",
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
        titulo,
        stage: "oportunidade",
        statusInterno: "novo",
        origem: "triagem_ia",
        clienteId: novoCliente.id,
      },
      origemInformacao: "lia:triagem_whatsapp",
    });

    revalidatePath("/dashboard/projetos");

    return { ok: true, projetoId: novoProjeto.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar oportunidade.";
    return { ok: false, error: message };
  }
}
