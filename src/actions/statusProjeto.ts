"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import {
  createStatusProjeto,
  updateStatusLabel,
  updateStatusCor,
  toggleStatusAtivo,
  moveStatusOrdem,
  deleteStatusProjeto,
} from "@/data/statusProjeto";

export async function criarStatusProjeto(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const stage = (formData.get("stage") as string)?.trim();
  const label = (formData.get("label") as string)?.trim();
  const cor = (formData.get("cor") as string)?.trim() || "#6b7280";
  const ativo = formData.get("ativo") !== "false";

  if (!stage || !label || label.length < 2) throw new Error("Label inválido.");

  await createStatusProjeto(empresaId, stage, label, cor, ativo);
  revalidatePath("/dashboard/projetos");
}

export async function editarLabelStatus(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const id = (formData.get("id") as string)?.trim();
  const label = (formData.get("label") as string)?.trim();

  if (!id || !label || label.length < 2) throw new Error("Dados inválidos.");

  await updateStatusLabel(empresaId, id, label);
  revalidatePath("/dashboard/projetos");
}

export async function editarCorStatus(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const id = (formData.get("id") as string)?.trim();
  const cor = (formData.get("cor") as string)?.trim();

  if (!id || !cor) throw new Error("Dados inválidos.");

  await updateStatusCor(empresaId, id, cor);
  revalidatePath("/dashboard/projetos");
}

export async function toggleAtivoStatus(id: string) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  if (!id) throw new Error("ID inválido.");

  await toggleStatusAtivo(empresaId, id);
  revalidatePath("/dashboard/projetos");
}

export async function moverOrdemStatus(id: string, direction: "up" | "down") {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  if (!id || !["up", "down"].includes(direction)) throw new Error("Dados inválidos.");

  await moveStatusOrdem(empresaId, id, direction);
  revalidatePath("/dashboard/projetos");
}

export async function excluirStatus(id: string) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  if (!id) throw new Error("ID inválido.");

  const result = await deleteStatusProjeto(empresaId, id);
  if (!result.ok) throw new Error(result.error ?? "Erro ao excluir.");

  revalidatePath("/dashboard/projetos");
}
