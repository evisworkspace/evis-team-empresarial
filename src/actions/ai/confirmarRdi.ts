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
  registroInterno: {
    confirmar: boolean;
    conteudo: string;
  };
  rdoPublicavel: {
    confirmar: boolean;
    descricao: string;
  };
  mensagens: Array<{
    confirmar: boolean;
    destinatarioTipo: string;
    destinatarioNome: string;
    canalSugerido: string;
    objetivo: string;
    textoRascunho: string;
  }>;
  tarefasSelecionadas: string[];
  agendaSelecionada: Array<{
    confirmar: boolean;
    titulo: string;
    tipo: string;
    descricao: string;
    dataHora: string;
  }>;
  anotacaoFormal: {
    confirmar: boolean;
    tipo: string;
    titulo: string;
    conteudo: string;
  };
}

export type ConfirmarRdiResult =
  | {
      ok: true;
      registrosInternos: number;
      rdosCriados: number;
      mensagensCriadas: number;
      tarefasCriadas: number;
      agendaItens: number;
      anotacoesCriadas: number;
    }
  | { ok: false; error: string };

export async function confirmarRdi(input: ConfirmarRdiInput): Promise<ConfirmarRdiResult> {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { projetoId, titulo } = input;

  if (!projetoId) {
    return { ok: false, error: "Dados insuficientes para confirmar o Registro." };
  }

  try {
    let registrosInternos = 0;
    let rdosCriados = 0;
    let mensagensCriadas = 0;
    let tarefasCriadas = 0;
    let agendaItens = 0;
    let anotacoesCriadas = 0;

    // Bloco 1 — Registro interno → ProjetoAtividade tipo "nota"
    if (input.registroInterno.confirmar && input.registroInterno.conteudo?.trim()) {
      await prisma.projetoAtividade.create({
        data: {
          empresaId,
          projetoId,
          tipo: "nota",
          descricao: input.registroInterno.conteudo.trim(),
        },
      });
      registrosInternos++;
    }

    // Bloco 2 — RDO publicável → DiarioDeObra rascunho
    if (input.rdoPublicavel.confirmar && input.rdoPublicavel.descricao?.trim()) {
      const numero = await getNextNumero(empresaId, projetoId);
      await prisma.diarioDeObra.create({
        data: {
          empresaId,
          projetoId,
          numero,
          data: new Date(),
          descricao: input.rdoPublicavel.descricao.trim(),
          status: "rascunho",
          processado: false,
        },
      });
      rdosCriados++;
    }

    // Bloco 3 — Mensagens → ProjetoAtividade tipo "mensagem"
    for (const msg of input.mensagens) {
      if (!msg.confirmar || !msg.textoRascunho?.trim()) continue;
      const prefixo = `[Para: ${msg.destinatarioNome} via ${msg.canalSugerido}] `;
      await prisma.projetoAtividade.create({
        data: {
          empresaId,
          projetoId,
          tipo: "mensagem",
          descricao: prefixo + msg.textoRascunho.trim(),
        },
      });
      mensagensCriadas++;
    }

    // Bloco 4 — Tarefas
    for (const descricao of input.tarefasSelecionadas) {
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

    // Bloco 5 — Agenda → AgendaItem (apenas com data válida)
    for (const item of input.agendaSelecionada) {
      if (!item.confirmar || !item.titulo?.trim() || !item.dataHora?.trim()) continue;
      const inicio = new Date(item.dataHora);
      if (isNaN(inicio.getTime())) continue;
      await prisma.agendaItem.create({
        data: {
          empresaId,
          projetoId,
          titulo: item.titulo.trim(),
          tipo: item.tipo?.trim() || "compromisso",
          descricao: item.descricao?.trim() || null,
          inicio,
          status: "agendado",
          origem: "sugerida_ia",
        },
      });
      agendaItens++;
    }

    // Bloco 6 — Anotação formal
    if (input.anotacaoFormal.confirmar && input.anotacaoFormal.conteudo?.trim()) {
      await prisma.anotacao.create({
        data: {
          empresaId,
          projetoId,
          titulo: (input.anotacaoFormal.titulo?.trim() || titulo).slice(0, 200),
          conteudo: input.anotacaoFormal.conteudo.trim(),
          visivelCliente: false,
        },
      });
      anotacoesCriadas++;
    }

    await createAuditEntry({
      empresaId,
      projetoId,
      eventoTipo: "validacao_ia",
      entidadeTipo: "projeto",
      entidadeId: projetoId,
      conteudoPersistido: {
        tipo: "registro_operacional",
        titulo,
        registrosInternos,
        rdosCriados,
        mensagensCriadas,
        tarefasCriadas,
        agendaItens,
        anotacoesCriadas,
      },
      origemInformacao: "lia:registro",
    });

    revalidatePath(`/dashboard/projetos/${projetoId}`);

    return {
      ok: true,
      registrosInternos,
      rdosCriados,
      mensagensCriadas,
      tarefasCriadas,
      agendaItens,
      anotacoesCriadas,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao confirmar Registro.";
    console.error("[confirmarRdi]", message);
    return { ok: false, error: "Erro ao salvar os registros. Tente novamente." };
  }
}
