"use server"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createUnidadeMedida, updateUnidadeMedida, deleteUnidadeMedida } from "@/data/unidadeMedida"

const PATH = "/dashboard/catalogo"

export async function criarUnidadeMedida(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const nome = (formData.get("nome") as string)?.trim()
  if (!nome) throw new Error("Nome obrigatório.")
  await createUnidadeMedida(empresaId, { nome })
  revalidatePath(PATH)
}

export async function editarUnidadeMedida(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const nome = (formData.get("nome") as string)?.trim()
  if (!nome) throw new Error("Nome obrigatório.")
  await updateUnidadeMedida(empresaId, id, { nome })
  revalidatePath(PATH)
}

export async function toggleAtivoUnidadeMedida(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const ativo = formData.get("ativo") === "true"
  await updateUnidadeMedida(empresaId, id, { ativo: !ativo })
  revalidatePath(PATH)
}

export async function excluirUnidadeMedida(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  await deleteUnidadeMedida(empresaId, id)
  revalidatePath(PATH)
}
