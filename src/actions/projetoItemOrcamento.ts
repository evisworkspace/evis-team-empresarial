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

function dec(v: FormDataEntryValue | null): number | undefined {
  if (!v) return undefined
  const n = parseFloat(v as string)
  return isNaN(n) ? undefined : n
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
  const custoServicos = dec(formData.get("custoServicos"))
  const bdi = dec(formData.get("bdi"))
  const produtos = dec(formData.get("produtos"))
  const servicos =
    custoServicos != null && bdi != null
      ? ((custoServicos ?? 0) + (produtos ?? 0)) * (1 + bdi / 100)
      : undefined
  await createItemOrcamento(empresaId, {
    projetoId,
    tipo: "composicao",
    nome,
    parentId: str(formData.get("parentId")) ?? undefined,
    grupo: str(formData.get("grupo")) ?? undefined,
    itemBibliotecaId: str(formData.get("itemBibliotecaId")) ?? undefined,
    fornecedorId: str(formData.get("fornecedorId")) ?? undefined,
    unidade: str(formData.get("unidade")) ?? undefined,
    quantidade: dec(formData.get("quantidade")),
    custoServicos,
    bdi,
    produtos,
    servicos,
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
  const custoServicos = dec(formData.get("custoServicos")) ?? null
  const bdi = dec(formData.get("bdi")) ?? null
  const produtos = dec(formData.get("produtos")) ?? null
  const servicos =
    custoServicos != null && bdi != null
      ? ((custoServicos ?? 0) + (produtos ?? 0)) * (1 + bdi / 100)
      : null
  await updateItemOrcamento(empresaId, id, {
    nome,
    grupo: str(formData.get("grupo")),
    unidade: str(formData.get("unidade")),
    quantidade: dec(formData.get("quantidade")) ?? null,
    custoServicos,
    bdi,
    produtos,
    servicos,
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
