"use server"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createCentroDeCusto, updateCentroDeCusto, deleteCentroDeCusto } from "@/data/centroDeCusto"

const PATH = "/dashboard/financeiro/config"

export async function criarCentroDeCusto(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const nome = (formData.get("nome") as string)?.trim()
  if (!nome) throw new Error("Nome obrigatório.")
  await createCentroDeCusto(empresaId, { nome })
  revalidatePath(PATH)
}

export async function editarCentroDeCusto(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const nome = (formData.get("nome") as string)?.trim()
  if (!nome) throw new Error("Nome obrigatório.")
  await updateCentroDeCusto(empresaId, id, { nome })
  revalidatePath(PATH)
}

export async function toggleAtivoCentroDeCusto(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const ativo = formData.get("ativo") === "true"
  await updateCentroDeCusto(empresaId, id, { ativo: !ativo })
  revalidatePath(PATH)
}

export async function excluirCentroDeCusto(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  await deleteCentroDeCusto(empresaId, id)
  revalidatePath(PATH)
}
