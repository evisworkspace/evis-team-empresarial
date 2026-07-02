"use server"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  createItemOrcamento,
  updateItemOrcamento,
  deleteItemOrcamento,
} from "@/data/projetoItemOrcamento"

function dec(v: FormDataEntryValue | null): number | null {
  if (!v) return null
  const n = parseFloat(v as string)
  return isNaN(n) ? null : n
}

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string)?.trim()
  return s || null
}

function path(projetoId: string) {
  return `/dashboard/projetos/${projetoId}`
}

export async function criarGrupoOrcamento(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const projetoId = formData.get("projetoId") as string
  const nome = (formData.get("nome") as string)?.trim()
  const parentId = str(formData.get("parentId")) ?? undefined
  const tipo = parentId ? "subnivel" : "nivel"
  if (!nome) throw new Error("Nome obrigatório.")
  await createItemOrcamento(empresaId, { projetoId, tipo, nome, parentId })
  revalidatePath(path(projetoId))
}

export async function criarItemOrcamento(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const projetoId = formData.get("projetoId") as string
  const nome = (formData.get("nome") as string)?.trim()
  if (!nome) throw new Error("Nome obrigatório.")

  const custoUnitario = dec(formData.get("custoUnitario"))
  const custoServicos = dec(formData.get("custoServicos"))
  const produtos = dec(formData.get("produtos"))
  const bdi = dec(formData.get("bdi"))
  const quantidade = dec(formData.get("quantidade"))

  const csRaw = (custoServicos ?? 0) + (produtos ?? 0)
  const custoTotal = csRaw > 0
    ? csRaw
    : custoUnitario != null && quantidade != null
      ? custoUnitario * quantidade
      : null
  const servicos = custoTotal != null && bdi != null
    ? custoTotal * (1 + bdi / 100)
    : null
  const precoTotal = servicos
  const precoUnitario = custoUnitario != null && bdi != null
    ? custoUnitario * (1 + bdi / 100)
    : null

  await createItemOrcamento(empresaId, {
    projetoId,
    tipo: "composicao",
    nome,
    parentId: str(formData.get("parentId")) ?? undefined,
    grupo: str(formData.get("grupo")),
    tipoItem: str(formData.get("tipoItem")),
    categoriaItemId: str(formData.get("categoriaItemId")),
    classe: str(formData.get("classe")),
    itemBibliotecaId: str(formData.get("itemBibliotecaId")),
    fornecedorId: str(formData.get("fornecedorId")),
    unidade: str(formData.get("unidade")),
    quantidade,
    custoUnitario,
    custoServicos,
    produtos,
    custoTotal,
    bdi,
    precoUnitario,
    servicos,
    precoTotal,
    statusItem: str(formData.get("statusItem")),
  })
  revalidatePath(path(projetoId))
}

export async function editarItemOrcamento(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const projetoId = formData.get("projetoId") as string
  const id = formData.get("id") as string
  const nome = (formData.get("nome") as string)?.trim()
  if (!nome) throw new Error("Nome obrigatório.")

  const custoUnitario = dec(formData.get("custoUnitario"))
  const custoServicos = dec(formData.get("custoServicos"))
  const produtos = dec(formData.get("produtos"))
  const bdi = dec(formData.get("bdi"))
  const quantidade = dec(formData.get("quantidade"))

  const csRaw = (custoServicos ?? 0) + (produtos ?? 0)
  const custoTotal = csRaw > 0
    ? csRaw
    : custoUnitario != null && quantidade != null
      ? custoUnitario * quantidade
      : null
  const servicos = custoTotal != null && bdi != null
    ? custoTotal * (1 + bdi / 100)
    : null
  const precoTotal = servicos
  const precoUnitario = custoUnitario != null && bdi != null
    ? custoUnitario * (1 + bdi / 100)
    : null

  await updateItemOrcamento(empresaId, id, {
    nome,
    grupo: str(formData.get("grupo")),
    tipoItem: str(formData.get("tipoItem")),
    categoriaItemId: str(formData.get("categoriaItemId")),
    classe: str(formData.get("classe")),
    unidade: str(formData.get("unidade")),
    quantidade,
    custoUnitario,
    custoServicos,
    produtos,
    custoTotal,
    bdi,
    precoUnitario,
    servicos,
    precoTotal,
    itemBibliotecaId: str(formData.get("itemBibliotecaId")),
    fornecedorId: str(formData.get("fornecedorId")),
    statusItem: str(formData.get("statusItem")),
  })
  revalidatePath(path(projetoId))
}

export async function excluirItemOrcamento(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const projetoId = formData.get("projetoId") as string
  const id = formData.get("id") as string
  await deleteItemOrcamento(empresaId, id)
  revalidatePath(path(projetoId))
}
