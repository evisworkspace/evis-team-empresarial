"use server"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  createCategoriaFinanceira,
  updateCategoriaFinanceira,
  deleteCategoriaFinanceira,
} from "@/data/categoriaFinanceira"

const PATH = "/dashboard/financeiro/config"

export async function criarCategoriaFinanceira(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const nome = (formData.get("nome") as string)?.trim()
  const numero = (formData.get("numero") as string)?.trim()
  const tipo = (formData.get("tipo") as string)?.trim()
  const grupoDRE = (formData.get("grupoDRE") as string)?.trim() || undefined
  const parentId = (formData.get("parentId") as string)?.trim() || undefined
  if (!nome) throw new Error("Nome obrigatório.")
  if (!numero) throw new Error("Número obrigatório.")
  if (!tipo) throw new Error("Tipo obrigatório.")
  await createCategoriaFinanceira(empresaId, { nome, numero, tipo, grupoDRE, parentId })
  revalidatePath(PATH)
}

export async function editarCategoriaFinanceira(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const nome = (formData.get("nome") as string)?.trim()
  const numero = (formData.get("numero") as string)?.trim()
  const tipo = (formData.get("tipo") as string)?.trim()
  const grupoDRE = (formData.get("grupoDRE") as string)?.trim() || undefined
  const parentIdRaw = (formData.get("parentId") as string)?.trim()
  const parentId = parentIdRaw || null
  if (!nome) throw new Error("Nome obrigatório.")
  await updateCategoriaFinanceira(empresaId, id, { nome, numero, tipo, grupoDRE, parentId })
  revalidatePath(PATH)
}

export async function toggleAtivoCategoriaFinanceira(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const ativo = formData.get("ativo") === "true"
  await updateCategoriaFinanceira(empresaId, id, { ativo: !ativo })
  revalidatePath(PATH)
}

export async function excluirCategoriaFinanceira(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  await deleteCategoriaFinanceira(empresaId, id)
  revalidatePath(PATH)
}
