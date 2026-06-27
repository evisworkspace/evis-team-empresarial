"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createTarefa } from "@/data/tarefa";
import { createAtividade } from "@/data/projetoAtividade";
import { createAgendaItem } from "@/data/agenda";
import { createAuditEntry } from "@/lib/audit";

interface AcaoTarefa {
  tipo: "tarefa";
  descricao: string;
  dataPrevista?: string;
  projetoId: string;
}

interface AcaoAgenda {
  tipo: "agenda";
  titulo?: string;
  descricao: string;
  dataPrevista: string;
  tipoAgenda?: string;
  projetoId?: string;
}

interface AcaoVisitaTecnica {
  tipo: "visita_tecnica";
  descricao: string;
  dataPrevista?: string;
  projetoId: string;
}

interface AcaoAtividade {
  tipo: "atividade";
  descricao: string;
  tipoAtividade?: string;
  projetoId: string;
}

type Acao = AcaoTarefa | AcaoAgenda | AcaoVisitaTecnica | AcaoAtividade;

function parseDataPrevista(value?: string) {
  if (!value) return undefined;
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return undefined;
  return data;
}

export async function executarAcaoLia(acao: Acao): Promise<{ ok: boolean; erro?: string }> {
  const session = await auth();
  const empresaId = getEmpresaId(session);

  if (acao.tipo !== "agenda" && !acao.projetoId) {
    return {
      ok: false,
      erro: "Projeto não identificado. Abra um projeto antes de confirmar a ação.",
    };
  }

  if (!acao.descricao || acao.descricao.trim().length < 2) {
    return { ok: false, erro: "Descrição da ação inválida." };
  }

  try {
    if (acao.tipo === "agenda") {
      const inicio = parseDataPrevista(acao.dataPrevista);
      if (!inicio) return { ok: false, erro: "Data da agenda inválida." };

      const agenda = await createAgendaItem(empresaId, {
        projetoId: acao.projetoId || null,
        titulo: acao.titulo?.trim() || acao.descricao.trim().slice(0, 120),
        descricao: acao.descricao.trim(),
        tipo: acao.tipoAgenda ?? "compromisso",
        inicio,
        origem: "sugerida_ia",
      });

      if (acao.projetoId) {
        await createAtividade(empresaId, {
          projetoId: acao.projetoId,
          tipo: "nota",
          descricao: `[Lia] Agenda criada: ${agenda.titulo}`,
        });
        revalidatePath(`/dashboard/projetos/${acao.projetoId}`);
      }

      await createAuditEntry({
        empresaId,
        projetoId: acao.projetoId || null,
        eventoTipo: "validacao_ia",
        entidadeTipo: "agenda_item",
        entidadeId: agenda.id,
        conteudoPersistido: { titulo: agenda.titulo, inicio: agenda.inicio.toISOString() },
        origemInformacao: "lia:copiloto",
      });
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/diario");
      return { ok: true };
    }

    if (acao.tipo === "tarefa") {
      const tarefa = await createTarefa(empresaId, {
        projetoId: acao.projetoId,
        descricao: acao.descricao.trim(),
        dataPrevista: parseDataPrevista(acao.dataPrevista),
        status: "aberta",
        origem: "sugerida_ia",
      });
      await createAuditEntry({
        empresaId,
        projetoId: acao.projetoId,
        eventoTipo: "validacao_ia",
        entidadeTipo: "tarefa",
        entidadeId: tarefa.id,
        conteudoPersistido: { acao: "criada_pela_lia" },
        origemInformacao: "lia:copiloto",
      });
      revalidatePath(`/dashboard/projetos/${acao.projetoId}`);
      revalidatePath("/dashboard/tarefas");
      return { ok: true };
    }

    if (acao.tipo === "visita_tecnica") {
      const tarefa = await createTarefa(empresaId, {
        projetoId: acao.projetoId,
        descricao: acao.descricao.trim(),
        dataPrevista: parseDataPrevista(acao.dataPrevista),
        status: "aberta",
        origem: "sugerida_ia",
      });
      await createAtividade(empresaId, {
        projetoId: acao.projetoId,
        tipo: "visita",
        descricao: `[Lia] Visita técnica: ${acao.descricao.trim()}`,
      });
      await createAuditEntry({
        empresaId,
        projetoId: acao.projetoId,
        eventoTipo: "validacao_ia",
        entidadeTipo: "tarefa",
        entidadeId: tarefa.id,
        conteudoPersistido: { acao: "visita_tecnica_criada_pela_lia" },
        origemInformacao: "lia:copiloto",
      });
      revalidatePath(`/dashboard/projetos/${acao.projetoId}`);
      revalidatePath("/dashboard/tarefas");
      return { ok: true };
    }

    const tiposValidos = ["ligacao", "visita", "email", "reuniao", "nota", "outro"];
    const tipo = acao.tipoAtividade && tiposValidos.includes(acao.tipoAtividade)
      ? acao.tipoAtividade
      : "nota";

    await createAtividade(empresaId, {
      projetoId: acao.projetoId,
      tipo,
      descricao: acao.descricao.trim(),
    });
    revalidatePath(`/dashboard/projetos/${acao.projetoId}`);
    revalidatePath("/dashboard/diario");
    return { ok: true };
  } catch (error) {
    console.error("[executarAcaoLia]", error);
    return { ok: false, erro: "Erro ao executar ação." };
  }
}
