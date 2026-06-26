"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createAnotacao, deleteAnotacao } from "@/data/anotacao";

export async function criarAnotacao(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const projetoId = formData.get("projetoId") as string;
  const titulo = (formData.get("titulo") as string)?.trim() || undefined;
  const conteudo = (formData.get("conteudo") as string)?.trim();
  if (!projetoId) throw new Error("projetoId obrigatório.");
  if (!conteudo || conteudo.length < 1) throw new Error("Conteúdo obrigatório.");
  await createAnotacao(empresaId, { projetoId, titulo, conteudo });
  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function excluirAnotacao(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const anotacaoId = formData.get("anotacaoId") as string;
  const projetoId = formData.get("projetoId") as string;
  if (!anotacaoId) throw new Error("anotacaoId obrigatório.");
  await deleteAnotacao(empresaId, anotacaoId);
  revalidatePath(`/dashboard/projetos/${projetoId}`);
}
