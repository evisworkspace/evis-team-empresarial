"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createTarefa } from "@/data/tarefa";
import { createAtividade } from "@/data/projetoAtividade";
import { createAgendaItem } from "@/data/agenda";
import { createAuditEntry } from "@/lib/audit";

type EvidenciaLia = {
  entradaOriginal?: string;
  anexos?: { name: string; mimeType: string; size: number }[];
};

interface AcaoTarefa {
  tipo: "tarefa";
  descricao: string;
  dataPrevista?: string;
  projetoId: string;
  entradaOriginal?: string;
  anexos?: EvidenciaLia["anexos"];
}

interface AcaoAgenda {
  tipo: "agenda";
  titulo?: string;
  descricao: string;
  dataPrevista: string;
  tipoAgenda?: string;
  projetoId?: string;
  entradaOriginal?: string;
  anexos?: EvidenciaLia["anexos"];
}

interface AcaoVisitaTecnica {
  tipo: "visita_tecnica";
  descricao: string;
  dataPrevista?: string;
  projetoId: string;
  entradaOriginal?: string;
  anexos?: EvidenciaLia["anexos"];
}

interface AcaoAtividade {
  tipo: "atividade";
  descricao: string;
  tipoAtividade?: string;
  projetoId: string;
  entradaOriginal?: string;
  anexos?: EvidenciaLia["anexos"];
}

interface AcaoNovaOportunidade {
  tipo: "nova_oportunidade";
  clienteNome: string;
  clienteTelefone?: string;
  titulo: string;
  descricao?: string;
  enderecoObra?: string;
  tipoObra?: string;
  origem?: string;
  projetoId?: string; // opcional para manter consistência nas propriedades básicas
  entradaOriginal?: string;
  anexos?: EvidenciaLia["anexos"];
}

type Acao = AcaoTarefa | AcaoAgenda | AcaoVisitaTecnica | AcaoAtividade | AcaoNovaOportunidade;

function parseDataPrevista(value?: string) {
  if (!value) return undefined;
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return undefined;
  return data;
}

function buildEvidencia(acao: EvidenciaLia) {
  return {
    entradaOriginal: acao.entradaOriginal?.trim() || null,
    anexos: acao.anexos?.map((anexo) => ({
      nome: anexo.name,
      tipo: anexo.mimeType,
      tamanho: anexo.size,
    })) ?? [],
  };
}

function buildTimelineDescription(prefixo: string, acao: EvidenciaLia) {
  const evidencia = buildEvidencia(acao);
  const linhas = [prefixo];
  if (evidencia.entradaOriginal) linhas.push(`Entrada original: ${evidencia.entradaOriginal}`);
  if (evidencia.anexos.length > 0) {
    linhas.push(`Anexos: ${evidencia.anexos.map((anexo) => anexo.nome).join(", ")}`);
  }
  return linhas.join("\n");
}

export async function executarAcaoLia(acao: Acao): Promise<{ ok: boolean; erro?: string; projetoId?: string }> {
  const session = await auth();
  const empresaId = getEmpresaId(session);

  if (acao.tipo !== "agenda" && acao.tipo !== "nova_oportunidade" && !acao.projetoId) {
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
      const evidencia = buildEvidencia(acao);

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
          descricao: buildTimelineDescription(`[Lia] Agenda criada: ${agenda.titulo}`, acao),
        });
        revalidatePath(`/dashboard/projetos/${acao.projetoId}`);
      }

      await createAuditEntry({
        empresaId,
        projetoId: acao.projetoId || null,
        eventoTipo: "validacao_ia",
        entidadeTipo: "agenda_item",
        entidadeId: agenda.id,
        conteudoPersistido: {
          titulo: agenda.titulo,
          inicio: agenda.inicio.toISOString(),
          evidencia,
        },
        origemInformacao: "lia:copiloto",
      });
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/diario");
      return { ok: true };
    }

    if (acao.tipo === "tarefa") {
      const evidencia = buildEvidencia(acao);
      const tarefa = await createTarefa(empresaId, {
        projetoId: acao.projetoId,
        descricao: acao.descricao.trim(),
        dataPrevista: parseDataPrevista(acao.dataPrevista),
        status: "aberta",
        origem: "sugerida_ia",
      });
      await createAtividade(empresaId, {
        projetoId: acao.projetoId,
        tipo: "nota",
        descricao: buildTimelineDescription(`[Lia] Tarefa criada: ${acao.descricao.trim()}`, acao),
      });
      await createAuditEntry({
        empresaId,
        projetoId: acao.projetoId,
        eventoTipo: "validacao_ia",
        entidadeTipo: "tarefa",
        entidadeId: tarefa.id,
        conteudoPersistido: { acao: "criada_pela_lia", descricao: acao.descricao.trim(), evidencia },
        origemInformacao: "lia:copiloto",
      });
      revalidatePath(`/dashboard/projetos/${acao.projetoId}`);
      revalidatePath("/dashboard/tarefas");
      revalidatePath("/dashboard/diario");
      return { ok: true };
    }

    if (acao.tipo === "visita_tecnica") {
      const evidencia = buildEvidencia(acao);
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
        descricao: buildTimelineDescription(`[Lia] Visita técnica: ${acao.descricao.trim()}`, acao),
      });
      await createAuditEntry({
        empresaId,
        projetoId: acao.projetoId,
        eventoTipo: "validacao_ia",
        entidadeTipo: "tarefa",
        entidadeId: tarefa.id,
        conteudoPersistido: { acao: "visita_tecnica_criada_pela_lia", descricao: acao.descricao.trim(), evidencia },
        origemInformacao: "lia:copiloto",
      });
      revalidatePath(`/dashboard/projetos/${acao.projetoId}`);
      revalidatePath("/dashboard/tarefas");
      return { ok: true };
    }

    if (acao.tipo === "nova_oportunidade") {
      const { criarOportunidadeDoCopiloto } = await import("@/actions/ai/criarOportunidadeDoCopiloto");
      const resultado = await criarOportunidadeDoCopiloto({
        clienteNome: acao.clienteNome,
        clienteTelefone: acao.clienteTelefone,
        titulo: acao.titulo,
        descricao: acao.descricao,
        enderecoObra: acao.enderecoObra,
        tipoObra: acao.tipoObra,
        origem: acao.origem,
      });
      if (!resultado.ok) return { ok: false, erro: resultado.error };
      return { ok: true, projetoId: resultado.projetoId };
    }

    const tiposValidos = ["ligacao", "visita", "email", "reuniao", "nota", "outro"];
    const tipo = acao.tipoAtividade && tiposValidos.includes(acao.tipoAtividade)
      ? acao.tipoAtividade
      : "nota";

    const atividade = await createAtividade(empresaId, {
      projetoId: acao.projetoId,
      tipo,
      descricao: buildTimelineDescription(`[Lia] ${acao.descricao.trim()}`, acao),
    });
    await createAuditEntry({
      empresaId,
      projetoId: acao.projetoId,
      eventoTipo: "validacao_ia",
      entidadeTipo: "projeto_atividade",
      entidadeId: atividade.id,
      conteudoPersistido: {
        acao: "atividade_criada_pela_lia",
        tipo,
        descricao: acao.descricao.trim(),
        evidencia: buildEvidencia(acao),
      },
      origemInformacao: "lia:copiloto",
    });
    revalidatePath(`/dashboard/projetos/${acao.projetoId}`);
    revalidatePath("/dashboard/diario");
    return { ok: true };
  } catch (error) {
    console.error("[executarAcaoLia]", error);
    return { ok: false, erro: "Erro ao executar ação." };
  }
}
