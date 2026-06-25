"use server"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createCategoriaItem, updateCategoriaItem, deleteCategoriaItem } from "@/data/categoriaItem"

const PATH = "/dashboard/catalogo"

export async function criarCategoriaItem(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const nome = (formData.get("nome") as string)?.trim()
  if (!nome) throw new Error("Nome obrigatório.")
  await createCategoriaItem(empresaId, { nome })
  revalidatePath(PATH)
}

export async function editarCategoriaItem(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const nome = (formData.get("nome") as string)?.trim()
  if (!nome) throw new Error("Nome obrigatório.")
  await updateCategoriaItem(empresaId, id, { nome })
  revalidatePath(PATH)
}

export async function toggleAtivoCategoriaItem(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const ativo = formData.get("ativo") === "true"
  await updateCategoriaItem(empresaId, id, { ativo: !ativo })
  revalidatePath(PATH)
}

export async function excluirCategoriaItem(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  await deleteCategoriaItem(empresaId, id)
  revalidatePath(PATH)
}
