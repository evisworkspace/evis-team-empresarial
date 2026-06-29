"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getNextNumero } from "@/data/diarioObra";
import { createAuditEntry } from "@/lib/audit";

export interface ConfirmarRdiInput {
  projetoId: string;
  titulo: string;
  anotacaoConteudo: string;
  diarioDescricao: string;
  tarefasSelecionadas: string[];
}

export type ConfirmarRdiResult =
  | { ok: true; anotacaoId: string; diarioId: string; tarefasCriadas: number }
  | { ok: false; error: string };

export async function confirmarRdi(input: ConfirmarRdiInput): Promise<ConfirmarRdiResult> {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const { projetoId, titulo, anotacaoConteudo, diarioDescricao, tarefasSelecionadas } = input;

  if (!projetoId || !anotacaoConteudo?.trim()) {
    return { ok: false, error: "Dados insuficientes para confirmar o RDI." };
  }

  try {
    const anotacao = await prisma.anotacao.create({
      data: {
        empresaId,
        projetoId,
        titulo: titulo.trim().slice(0, 200) || "RDI — Diário de Gestão Interna",
        conteudo: anotacaoConteudo.trim(),
        visivelCliente: false,
      },
      select: { id: true },
    });

    const numero = await getNextNumero(empresaId, projetoId);
    const diario = await prisma.diarioDeObra.create({
      data: {
        empresaId,
        projetoId,
        numero,
        data: new Date(),
        descricao: diarioDescricao.trim() || `RDI: ${titulo.trim().slice(0, 120)}`,
        status: "concluido",
        processado: true,
      },
      select: { id: true },
    });

    let tarefasCriadas = 0;
    for (const descricao of tarefasSelecionadas) {
      if (!descricao?.trim()) continue;
      await prisma.tarefa.create({
        data: {
          empresaId,
          projetoId,
          descricao: descricao.trim(),
          status: "aberta",
          origem: "sugerida_ia",
        },
      });
      tarefasCriadas++;
    }

    await prisma.projetoAtividade.create({
      data: {
        empresaId,
        projetoId,
        tipo: "nota",
        descricao: `RDI processado via Copiloto: ${titulo.trim().slice(0, 120)}`,
      },
    });

    await createAuditEntry({
      empresaId,
      projetoId,
      eventoTipo: "validacao_ia",
      entidadeTipo: "projeto",
      entidadeId: projetoId,
      conteudoPersistido: { tipo: "rdi", anotacaoId: anotacao.id, diarioId: diario.id, tarefasCriadas },
      origemInformacao: "lia:rdi",
    });

    revalidatePath(`/dashboard/projetos/${projetoId}`);

    return { ok: true, anotacaoId: anotacao.id, diarioId: diario.id, tarefasCriadas };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao confirmar RDI.";
    console.error("[confirmarRdi]", message);
    return { ok: false, error: "Erro ao salvar os registros do RDI. Tente novamente." };
  }
}
