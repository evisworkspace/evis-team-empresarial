"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { uploadArquivo } from "@/lib/blob"
import { enviarConviteEquipe } from "@/lib/email"

export async function salvarPerfil(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)

  const nome = (formData.get("nome") as string)?.trim()
  const cpf = (formData.get("cpf") as string)?.trim() || null
  const telefone = (formData.get("telefone") as string)?.trim() || null

  if (!nome || nome.length < 2) throw new Error("Nome obrigatório.")

  let foto: string | undefined
  const fotoFile = formData.get("foto") as File | null
  if (fotoFile && fotoFile.size > 0) {
    foto = await uploadArquivo(fotoFile, "avatares")
  }

  await prisma.usuario.updateMany({
    where: { authUserId: session.user.id, empresaId, deletedAt: null },
    data: { nome, cpf, telefone, ...(foto ? { foto } : {}) },
  })

  revalidatePath("/dashboard/configuracoes/perfil")
}

export async function salvarEmpresa(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)

  const nome = (formData.get("nome") as string)?.trim()
  const tipoPessoa = (formData.get("tipoPessoa") as string) || "PJ"
  const documento = (formData.get("documento") as string)?.trim() || null
  const razaoSocial = (formData.get("razaoSocial") as string)?.trim() || null
  const email = (formData.get("email") as string)?.trim() || null
  const celular = (formData.get("celular") as string)?.trim() || null
  const isWhatsapp = formData.get("isWhatsapp") === "on"
  const tipoEmpresa = (formData.get("tipoEmpresa") as string)?.trim() || null
  const descricao = (formData.get("descricao") as string)?.trim() || null

  if (!nome || nome.length < 2) throw new Error("Nome obrigatório.")

  let logo: string | undefined
  const logoFile = formData.get("logo") as File | null
  if (logoFile && logoFile.size > 0) {
    logo = await uploadArquivo(logoFile, "logos")
  }

  await prisma.empresa.updateMany({
    where: { id: empresaId, deletedAt: null },
    data: {
      nome, tipoPessoa, documento, razaoSocial,
      email, celular, isWhatsapp, tipoEmpresa, descricao,
      ...(logo ? { logo } : {}),
    },
  })

  revalidatePath("/dashboard/configuracoes/empresa")
}

export async function convidarMembro(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)

  const emailConvidado = (formData.get("email") as string)?.trim().toLowerCase()
  const perfil = (formData.get("perfil") as string) || "membro"

  if (!emailConvidado) throw new Error("E-mail obrigatório.")

  const jaExiste = await prisma.usuario.findFirst({
    where: { empresaId, email: emailConvidado, deletedAt: null },
  })
  if (jaExiste) throw new Error("Este e-mail já faz parte da equipe.")

  const empresa = await prisma.empresa.findFirst({
    where: { id: empresaId, deletedAt: null },
    select: { nome: true },
  })

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.conviteEquipe.create({
    data: { empresaId, email: emailConvidado, perfil, token, expiresAt },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://evis-team.vercel.app"
  await enviarConviteEquipe({
    para: emailConvidado,
    nomeEmpresa: empresa?.nome ?? "EVIS",
    linkConvite: `${appUrl}/convite/${token}`,
  })

  revalidatePath("/dashboard/configuracoes/equipe")
}

export async function aceitarConviteAction(formData: FormData) {
  const token = formData.get("token") as string
  const session = await auth()

  if (!session?.user?.id || !session?.user?.email) {
    redirect(`/api/auth/signin?callbackUrl=/convite/${token}`)
  }

  const convite = await prisma.conviteEquipe.findUnique({
    where: { token },
  })

  if (!convite || convite.usedAt || new Date() > convite.expiresAt) {
    throw new Error("Convite inválido ou expirado.")
  }

  if (session.user.email.toLowerCase() !== convite.email.toLowerCase()) {
    throw new Error(`Este convite é para ${convite.email}.`)
  }

  await prisma.usuario.create({
    data: {
      empresaId: convite.empresaId,
      nome: session.user.name ?? session.user.email,
      email: session.user.email,
      perfil: convite.perfil,
      status: "ativo",
      authUserId: session.user.id,
    },
  })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { empresaId: convite.empresaId },
  })

  await prisma.conviteEquipe.update({
    where: { id: convite.id },
    data: { usedAt: new Date() },
  })

  redirect("/dashboard")
}
