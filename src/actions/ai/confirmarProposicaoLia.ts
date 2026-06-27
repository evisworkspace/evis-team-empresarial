"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createTarefa } from "@/data/tarefa";
import { createAtividade } from "@/data/projetoAtividade";

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

  if (["tarefa", "visita", "reuniao"].includes(tipo)) {
    if (!projetoId) {
      redirect(montarRetornoDiario(formData) + `&aviso=${encodeURIComponent("Selecione um projeto antes de confirmar a tarefa.")}`);
    }

    await createTarefa(empresaId, {
      projetoId,
      descricao: `${titulo}\n\n${descricao}`,
      dataPrevista,
      status: "aberta",
      origem: "sugerida_ia",
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
