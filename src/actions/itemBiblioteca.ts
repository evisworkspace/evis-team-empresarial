"use server"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  createItemBiblioteca,
  updateItemBiblioteca,
  deleteItemBiblioteca,
} from "@/data/itemBiblioteca"

const PATH = "/dashboard/biblioteca"

function parseDecimal(v: FormDataEntryValue | null) {
  if (!v) return undefined
  const n = parseFloat(v as string)
  return isNaN(n) ? undefined : n
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = (v as string)?.trim()
  return s || null
}

export async function criarItemBiblioteca(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const nome = (formData.get("nome") as string)?.trim()
  const tipo = formData.get("tipo") as string
  if (!nome || !tipo) throw new Error("Nome e tipo são obrigatórios.")
  await createItemBiblioteca(empresaId, {
    nome,
    tipo,
    codigo:        strOrNull(formData.get("codigo"))        ?? undefined,
    descricao:     strOrNull(formData.get("descricao"))     ?? undefined,
    precoUnitario: parseDecimal(formData.get("precoUnitario")),
    unidadeId:     strOrNull(formData.get("unidadeId"))     ?? undefined,
    grupoId:       strOrNull(formData.get("grupoId"))       ?? undefined,
    categoriaId:   strOrNull(formData.get("categoriaId"))   ?? undefined,
    fornecedorId:  strOrNull(formData.get("fornecedorId"))  ?? undefined,
  })
  revalidatePath(PATH)
  redirect(PATH)
}

export async function editarItemBiblioteca(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const nome = (formData.get("nome") as string)?.trim()
  const tipo = formData.get("tipo") as string
  if (!nome || !tipo) throw new Error("Nome e tipo são obrigatórios.")
  await updateItemBiblioteca(empresaId, id, {
    nome,
    tipo,
    codigo:        strOrNull(formData.get("codigo")),
    descricao:     strOrNull(formData.get("descricao")),
    precoUnitario: parseDecimal(formData.get("precoUnitario")) ?? null,
    unidadeId:     strOrNull(formData.get("unidadeId")),
    grupoId:       strOrNull(formData.get("grupoId")),
    categoriaId:   strOrNull(formData.get("categoriaId")),
    fornecedorId:  strOrNull(formData.get("fornecedorId")),
  })
  revalidatePath(PATH)
  redirect(PATH)
}

export async function toggleAtivoItemBiblioteca(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const ativo = formData.get("ativo") === "true"
  await updateItemBiblioteca(empresaId, id, { ativo: !ativo })
  revalidatePath(PATH)
}

export async function excluirItemBiblioteca(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  await deleteItemBiblioteca(empresaId, id)
  revalidatePath(PATH)
}
