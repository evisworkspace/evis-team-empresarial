"use server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { createMedicao, upsertMedicaoItens } from "@/data/medicao"

function path(projetoId: string) { return `/dashboard/projetos/${projetoId}` }

export async function criarMedicao(formData: FormData) {
  const session = await auth()
  const empresaId = getEmpresaId(session!)
  const projetoId = formData.get("projetoId") as string
  const dataStr = (formData.get("dataReferencia") as string)?.trim()
  if (!projetoId || !dataStr) throw new Error("Projeto e data são obrigatórios.")
  const dataReferencia = new Date(dataStr)
  if (isNaN(dataReferencia.getTime())) throw new Error("Data inválida.")
  const observacao = (formData.get("observacao") as string)?.trim() || undefined
  const medicao = await createMedicao(empresaId, { projetoId, dataReferencia, observacao })

  // Processar itens: pct_<id> e val_<id>
  const itens: { itemOrcamentoId: string; percentualMedido?: number; valorMedido?: number }[] = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("pct_")) {
      const itemId = key.replace("pct_", "")
      const pct = parseFloat(value as string)
      const val = parseFloat(formData.get(`val_${itemId}`) as string)
      itens.push({
        itemOrcamentoId: itemId,
        percentualMedido: isNaN(pct) ? undefined : pct,
        valorMedido: isNaN(val) ? undefined : val,
      })
    }
  }
  if (itens.length > 0) await upsertMedicaoItens(medicao.id, itens)
  revalidatePath(path(projetoId))
}
