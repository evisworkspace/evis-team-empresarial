"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import {
  createDiario,
  createItensHITL,
  getNextNumero,
  updateDiarioStatus,
  updateItemHITLStatus,
} from "@/data/diarioObra";
import { processarDiarioCanteiro } from "@/actions/ai/canteiro";
import { createTarefa } from "@/data/tarefa";
import { prisma } from "@/lib/prisma";

function path(projetoId: string) {
  return `/dashboard/projetos/${projetoId}`;
}

export async function criarDiario(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const projetoId = formData.get("projetoId") as string;
  const dataStr = (formData.get("data") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim();

  if (!projetoId || !dataStr || !descricao || descricao.length < 5) {
    throw new Error("Data e descrição são obrigatórios (mínimo 5 caracteres).");
  }

  const dataReferencia = new Date(dataStr);
  if (isNaN(dataReferencia.getTime())) throw new Error("Data inválida.");

  const numero = await getNextNumero(empresaId, projetoId);
  const diario = await createDiario(empresaId, {
    projetoId,
    numero,
    data: dataReferencia,
    descricao,
  });

  // Processar com Canteiro IA (não bloqueia se falhar)
  try {
    await updateDiarioStatus(empresaId, diario.id, "processando");
    const itens = await processarDiarioCanteiro(descricao, dataReferencia);
    if (itens.length > 0) {
      await createItensHITL(
        diario.id,
        empresaId,
        itens.map((i) => ({
          tipo: i.tipo,
          titulo: i.titulo,
          descricao: i.descricao,
          prioridade: i.prioridade,
          percentual: i.percentual,
          dataSugerida: i.dataSugerida ? new Date(i.dataSugerida) : undefined,
          confianca: i.confianca,
          motivoDeteccao: i.motivoDeteccao,
        }))
      );
    }
    await updateDiarioStatus(empresaId, diario.id, "concluido", true);
  } catch {
    await updateDiarioStatus(empresaId, diario.id, "concluido", true);
  }

  revalidatePath(path(projetoId));
}

export async function aprovarItemHITL(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const itemId = formData.get("itemId") as string;
  const projetoId = formData.get("projetoId") as string;
  const tipo = formData.get("tipo") as string;
  const titulo = formData.get("titulo") as string;
  const descricao = (formData.get("descricao") as string) || titulo;
  const dataSugeridaStr = formData.get("dataSugerida") as string;

  if (!itemId || !projetoId || !tipo) throw new Error("Dados obrigatórios.");

  await updateItemHITLStatus(empresaId, itemId, "aprovado");

  const dataPrevista = dataSugeridaStr ? new Date(dataSugeridaStr) : undefined;

  // Criar o item correspondente no módulo certo
  switch (tipo) {
    case "tarefa":
    case "proxima_demanda":
    case "problema_obra":
      await createTarefa(empresaId, {
        projetoId,
        descricao: titulo,
        dataPrevista,
        origem: "sugerida_ia",
        status: "aberta",
      });
      break;

    case "visita":
    case "atividade":
    case "observacao":
    case "registro_execucao": {
      const tipoAtividade =
        tipo === "visita" ? "visita" :
        tipo === "observacao" ? "nota" :
        "outro";
      await prisma.projetoAtividade.create({
        data: {
          empresaId,
          projetoId,
          tipo: tipoAtividade,
          descricao: descricao !== titulo ? `${titulo} — ${descricao}` : titulo,
        },
      });
      break;
    }
  }

  revalidatePath(path(projetoId));
}

export async function rejeitarItemHITL(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const itemId = formData.get("itemId") as string;
  const projetoId = formData.get("projetoId") as string;

  if (!itemId || !projetoId) throw new Error("Dados obrigatórios.");

  await updateItemHITLStatus(empresaId, itemId, "rejeitado");
  revalidatePath(path(projetoId));
}
