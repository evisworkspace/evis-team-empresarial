"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createTarefa } from "@/data/tarefa";
import { createAtividade } from "@/data/projetoAtividade";
import { createAgendaItem } from "@/data/agenda";
import { createAuditEntry } from "@/lib/audit";

function montarDataPrevista(dataSugerida: string | null, horarioSugerido: string | null) {
  if (!dataSugerida || !/^\d{4}-\d{2}-\d{2}$/.test(dataSugerida)) return undefined;

  const [ano, mes, dia] = dataSugerida.split("-").map(Number);
  const [hora, minuto] =
    horarioSugerido && /^\d{2}:\d{2}$/.test(horarioSugerido)
      ? horarioSugerido.split(":").map(Number)
      : [9, 0];
  const data = new Date(ano, mes - 1, dia, hora, minuto);

  if (Number.isNaN(data.getTime())) return undefined;
  return data;
}

function inferirTipoAgenda(tipo: string, titulo: string, descricao: string) {
  if (tipo === "reuniao") return "reuniao";
  const texto = `${titulo} ${descricao}`.toLowerCase();
  if (/visita|vistoria|levantamento/.test(texto)) return "visita";
  if (/ligar|ligação|telefone/.test(texto)) return "ligacao";
  if (/follow|retorno|retornar|cobrar/.test(texto)) return "follow_up";
  if (/prazo|vencimento|entrega/.test(texto)) return "prazo";
  return "compromisso";
}

function montarRetornoDiario(formData: FormData) {
  const remaining = (formData.get("remainingProposicoes") as string | null)?.trim();
  const remainingTotal = (formData.get("remainingTotal") as string | null)?.trim();
  const totalOriginal = (formData.get("totalOriginal") as string | null)?.trim();
  const confirmedCount = (formData.get("confirmedCount") as string | null)?.trim();

  const params = new URLSearchParams();
  params.set("confirmado", "1");
  if (confirmedCount) params.set("confirmados", confirmedCount);
  if (totalOriginal) params.set("totalOriginal", totalOriginal);

  if (remaining && remainingTotal && Number(remainingTotal) > 0) {
    params.set("proposicoes", remaining);
    params.set("total", remainingTotal);
  }

  return `/dashboard/diario?${params.toString()}`;
}

export async function confirmarProposicaoLia(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const tipo = ((formData.get("tipo_dispatch") as string) ?? "").trim();
  const titulo = ((formData.get("titulo") as string) ?? "").trim();
  const descricao = ((formData.get("descricao") as string) ?? "").trim();
  const dataSugerida = ((formData.get("data_sugerida") as string) ?? "").trim() || null;
  const horarioSugerido = ((formData.get("horario_sugerido") as string) ?? "").trim() || null;
  const projetoId = ((formData.get("projetoId") as string) ?? "").trim();

  if (!tipo || !titulo || !empresaId) {
    redirect("/dashboard/diario?erro=Dados insuficientes para confirmar item.");
  }

  const dataPrevista = montarDataPrevista(dataSugerida, horarioSugerido);

  if (tipo === "agenda" || tipo === "reuniao") {
    if (!dataPrevista) {
      redirect(montarRetornoDiario(formData) + `&aviso=${encodeURIComponent("Informe data e horário antes de confirmar o item de agenda.")}`);
    }

    const agenda = await createAgendaItem(empresaId, {
      projetoId: projetoId || null,
      titulo,
      descricao,
      tipo: inferirTipoAgenda(tipo, titulo, descricao),
      inicio: dataPrevista,
      origem: "sugerida_ia",
    });

    if (projetoId) {
      await createAtividade(empresaId, {
        projetoId,
        tipo: "nota",
        descricao: `[Lia] Agenda criada: ${titulo}${horarioSugerido ? ` às ${horarioSugerido}` : ""}`,
      });
      revalidatePath(`/dashboard/projetos/${projetoId}`);
    }

    await createAuditEntry({
      empresaId,
      projetoId: projetoId || null,
      eventoTipo: "validacao_ia",
      entidadeTipo: "agenda_item",
      entidadeId: agenda.id,
      conteudoPersistido: { titulo, tipo_dispatch: tipo, inicio: dataPrevista.toISOString() },
      origemInformacao: "lia:diario_dispatcher",
    });

    revalidatePath("/dashboard/diario");
  } else if (tipo === "visita_tecnica") {
    if (!projetoId) {
      redirect(montarRetornoDiario(formData) + `&aviso=${encodeURIComponent("Selecione um projeto antes de confirmar a visita técnica.")}`);
    }

    const tarefa = await createTarefa(empresaId, {
      projetoId,
      descricao: `${titulo}\n\n${descricao}`,
      dataPrevista,
      status: "aberta",
      origem: "sugerida_ia",
    });
    await createAtividade(empresaId, {
      projetoId,
      tipo: "visita",
      descricao: `[Lia] Visita técnica: ${titulo}: ${descricao}`,
    });
    await createAuditEntry({
      empresaId,
      projetoId,
      eventoTipo: "validacao_ia",
      entidadeTipo: "tarefa",
      entidadeId: tarefa.id,
      conteudoPersistido: { titulo, tipo_dispatch: tipo },
      origemInformacao: "lia:diario_dispatcher",
    });
    revalidatePath(`/dashboard/projetos/${projetoId}`);
    revalidatePath("/dashboard/tarefas");
  } else if (tipo === "tarefa" || tipo === "visita") {
    if (!projetoId) {
      redirect(montarRetornoDiario(formData) + `&aviso=${encodeURIComponent("Selecione um projeto antes de confirmar a tarefa.")}`);
    }

    const tarefa = await createTarefa(empresaId, {
      projetoId,
      descricao: `${titulo}\n\n${descricao}`,
      dataPrevista,
      status: "aberta",
      origem: "sugerida_ia",
    });
    await createAuditEntry({
      empresaId,
      projetoId,
      eventoTipo: "validacao_ia",
      entidadeTipo: "tarefa",
      entidadeId: tarefa.id,
      conteudoPersistido: { titulo, tipo_dispatch: tipo },
      origemInformacao: "lia:diario_dispatcher",
    });
    revalidatePath(`/dashboard/projetos/${projetoId}`);
    revalidatePath("/dashboard/tarefas");
  } else if (["nota", "financeiro", "documento"].includes(tipo)) {
    if (!projetoId) {
      redirect(montarRetornoDiario(formData) + `&aviso=${encodeURIComponent("Selecione um projeto antes de confirmar a nota.")}`);
    }

    await createAtividade(empresaId, {
      projetoId,
      tipo: "nota",
      descricao: `[Lia] ${titulo}: ${descricao}`,
    });
    revalidatePath(`/dashboard/projetos/${projetoId}`);
    revalidatePath("/dashboard/diario");
  } else if (tipo === "lead") {
    const params = new URLSearchParams();
    params.set("stage", "oportunidade");
    params.set("agenteFilled", "1");
    params.set("titulo", titulo);
    params.set("descricao", descricao);
    redirect(`/dashboard/projetos/novo?${params.toString()}`);
  } else {
    redirect(`/dashboard/diario?erro=${encodeURIComponent("Tipo de proposição não reconhecido.")}`);
  }

  redirect(montarRetornoDiario(formData));
}
