"use server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { updateItemPlanejamento } from "@/data/planejamento"

function path(projetoId: string) { return `/dashboard/projetos/${projetoId}` }
function parseDate(v: FormDataEntryValue | null) {
  const s = (v as string)?.trim()
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export async function salvarPlanejamentoItem(formData: FormData) {
  const session = await auth()
  const empresaId = getEmpresaId(session!)
  const projetoId = formData.get("projetoId") as string
  const id = formData.get("id") as string
  const diasRaw = parseInt(formData.get("diasDuracao") as string)
  await updateItemPlanejamento(empresaId, id, {
    dataInicioPlano: parseDate(formData.get("dataInicioPlano")),
    dataFimPlano: parseDate(formData.get("dataFimPlano")),
    diasDuracao: isNaN(diasRaw) ? null : diasRaw,
    responsavel: (formData.get("responsavel") as string)?.trim() || null,
  })
  revalidatePath(path(projetoId))
}
