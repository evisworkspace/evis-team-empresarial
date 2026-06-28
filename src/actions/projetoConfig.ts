"use server"

import { Decimal } from "@prisma/client/runtime/library"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

function parsePercent(v: FormDataEntryValue | null, fallback: number) {
  if (!v) return fallback
  const n = parseFloat(v as string)
  return Number.isFinite(n) ? n : fallback
}

export async function salvarProjetoConfig(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")

  const empresaId = getEmpresaId(session)
  const projetoId = formData.get("projetoId") as string
  const bdiPadraoP = parsePercent(formData.get("bdiPadraoP"), 10)
  const bdiPadraoS = parsePercent(formData.get("bdiPadraoS"), 15)

  await prisma.projetoConfig.upsert({
    where: { projetoId },
    create: {
      empresaId,
      projetoId,
      bdiPadraoP: new Decimal(bdiPadraoP),
      bdiPadraoS: new Decimal(bdiPadraoS),
    },
    update: {
      bdiPadraoP: new Decimal(bdiPadraoP),
      bdiPadraoS: new Decimal(bdiPadraoS),
    },
  })

  revalidatePath(`/dashboard/projetos/${projetoId}`)
}
