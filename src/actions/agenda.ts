"use server";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import {
  createAgendaItem,
  updateAgendaItemStatus,
  deleteAgendaItem,
} from "@/data/agenda";
import { revalidatePath } from "next/cache";

export async function criarAgendaItemAction(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const titulo = (formData.get("titulo") as string)?.trim();
  const tipo = (formData.get("tipo") as string) || "compromisso";
  const inicioRaw = formData.get("inicio") as string;
  const fimRaw = (formData.get("fim") as string) || "";
  const projetoId = (formData.get("projetoId") as string) || null;
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const localizacao = (formData.get("localizacao") as string)?.trim() || null;

  if (!titulo || !inicioRaw || !empresaId) return;
  const inicio = new Date(inicioRaw);
  if (isNaN(inicio.getTime())) return;
  const fim = fimRaw ? new Date(fimRaw) : null;
  if (fim && isNaN(fim.getTime())) return;

  await createAgendaItem(empresaId, {
    titulo,
    tipo,
    inicio,
    fim,
    descricao,
    localizacao,
    projetoId,
    origem: "manual",
    status: "agendado",
  });
  revalidatePath("/dashboard/agenda");
  if (projetoId) revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function marcarAgendaItemRealizadoAction(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const id = formData.get("id") as string;
  const projetoId = (formData.get("projetoId") as string) || null;
  if (!id || !empresaId) return;
  await updateAgendaItemStatus(empresaId, id, "realizado");
  revalidatePath("/dashboard/agenda");
  if (projetoId) revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function cancelarAgendaItemAction(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const id = formData.get("id") as string;
  const projetoId = (formData.get("projetoId") as string) || null;
  if (!id || !empresaId) return;
  await updateAgendaItemStatus(empresaId, id, "cancelado");
  revalidatePath("/dashboard/agenda");
  if (projetoId) revalidatePath(`/dashboard/projetos/${projetoId}`);
}

// deleteAgendaItem mantido disponível para uso futuro
export async function deletarAgendaItemAction(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const id = formData.get("id") as string;
  if (!id || !empresaId) return;
  await deleteAgendaItem(empresaId, id);
  revalidatePath("/dashboard/agenda");
}
