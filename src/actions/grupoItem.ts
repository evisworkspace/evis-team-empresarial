"use server"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createGrupoItem, updateGrupoItem, deleteGrupoItem } from "@/data/grupoItem"

const PATH = "/dashboard/catalogo"

export async function criarGrupoItem(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const nome = (formData.get("nome") as string)?.trim()
  if (!nome) throw new Error("Nome obrigatório.")
  await createGrupoItem(empresaId, { nome })
  revalidatePath(PATH)
}

export async function editarGrupoItem(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const nome = (formData.get("nome") as string)?.trim()
  if (!nome) throw new Error("Nome obrigatório.")
  await updateGrupoItem(empresaId, id, { nome })
  revalidatePath(PATH)
}

export async function toggleAtivoGrupoItem(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const ativo = formData.get("ativo") === "true"
  await updateGrupoItem(empresaId, id, { ativo: !ativo })
  revalidatePath(PATH)
}

export async function excluirGrupoItem(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  await deleteGrupoItem(empresaId, id)
  revalidatePath(PATH)
}
