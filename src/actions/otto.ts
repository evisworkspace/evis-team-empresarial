"use server"

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { pickGeminiKey } from "@/lib/gemini"
import { getEmpresaId } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import {
  countDecisoesPendentes,
  createOttoDecisoes,
  createOttoDocumento,
  createOttoItensEAP,
  createOttoSessao,
  deleteOttoDocumento,
  getOttoSessaoAtiva,
  getOttoSessaoById,
  marcarEAPExportada,
  responderOttoDecisao,
  softDeleteOttoItensEAPBySessao,
  updateOttoItemEAP,
  updateOttoSessaoEstado,
} from "@/data/otto"
import { createItemOrcamento } from "@/data/projetoItemOrcamento"

function path(projetoId: string) {
  return `/dashboard/projetos/${projetoId}`
}

function cleanJson(raw: string) {
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()
}

async function generateGeminiJson(prompt: string, responseSchema: unknown) {
  const apiKey = pickGeminiKey()
  if (!apiKey) throw new Error("GEMINI_API_KEY ausente.")
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as never,
    },
  })
  const result = await model.generateContent(prompt)
  return JSON.parse(cleanJson(result.response.text())) as unknown
}

const leituraTecnicaSchema = {
  type: SchemaType.OBJECT,
  properties: {
    resumo: { type: SchemaType.STRING },
    achados: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    lacunas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    riscosIdentificados: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    perguntasHITL: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          pergunta: { type: SchemaType.STRING },
          impacto: { type: SchemaType.STRING },
        },
        required: ["pergunta", "impacto"],
      },
    },
  },
  required: ["resumo", "achados", "lacunas", "perguntasHITL"],
}

const eapSchema = {
  type: SchemaType.OBJECT,
  properties: {
    itens: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          nivelEAP: { type: SchemaType.NUMBER },
          posicao: { type: SchemaType.NUMBER },
          nome: { type: SchemaType.STRING },
          descricao: { type: SchemaType.STRING },
          unidade: { type: SchemaType.STRING },
          quantidade: { type: SchemaType.NUMBER },
          statusEscopo: { type: SchemaType.STRING },
          natureza: { type: SchemaType.STRING },
          confianca: { type: SchemaType.STRING },
          fonte: { type: SchemaType.STRING },
          filhos: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                nivelEAP: { type: SchemaType.NUMBER },
                posicao: { type: SchemaType.NUMBER },
                nome: { type: SchemaType.STRING },
                descricao: { type: SchemaType.STRING },
                unidade: { type: SchemaType.STRING },
                quantidade: { type: SchemaType.NUMBER },
                statusEscopo: { type: SchemaType.STRING },
                natureza: { type: SchemaType.STRING },
                confianca: { type: SchemaType.STRING },
                fonte: { type: SchemaType.STRING },
                filhos: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      nivelEAP: { type: SchemaType.NUMBER },
                      posicao: { type: SchemaType.NUMBER },
                      nome: { type: SchemaType.STRING },
                      descricao: { type: SchemaType.STRING },
                      unidade: { type: SchemaType.STRING },
                      quantidade: { type: SchemaType.NUMBER },
                      statusEscopo: { type: SchemaType.STRING },
                      natureza: { type: SchemaType.STRING },
                      confianca: { type: SchemaType.STRING },
                      fonte: { type: SchemaType.STRING },
                    },
                    required: ["nivelEAP", "posicao", "nome"],
                  },
                },
              },
              required: ["nivelEAP", "posicao", "nome"],
            },
          },
        },
        required: ["nivelEAP", "posicao", "nome"],
      },
    },
  },
  required: ["itens"],
}

type PerguntaHitl = { pergunta: string; impacto?: string }
type EAPItem = {
  nivelEAP?: number
  posicao?: number
  nome?: string
  descricao?: string | null
  unidade?: string | null
  quantidade?: number | null
  statusEscopo?: string | null
  natureza?: string | null
  confianca?: string | null
  fonte?: string | null
  filhos?: EAPItem[]
}

export async function iniciarOttoSessao(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const projetoId = formData.get("projetoId") as string
  const ativa = await getOttoSessaoAtiva(empresaId, projetoId)
  if (!ativa) await createOttoSessao(empresaId, projetoId)
  revalidatePath(path(projetoId))
}

export async function adicionarDocumentoOtto(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const sessaoId = formData.get("sessaoId") as string
  const projetoId = formData.get("projetoId") as string
  const tipo = ((formData.get("tipo") as string) || "texto").trim()
  const titulo = (formData.get("titulo") as string)?.trim()
  const conteudo = (formData.get("conteudo") as string)?.trim() || undefined
  const url = (formData.get("url") as string)?.trim() || undefined
  if (!titulo || (tipo === "texto" && !conteudo) || (tipo === "url" && !url)) return

  await createOttoDocumento(empresaId, sessaoId, { tipo, titulo, conteudo, url })
  await updateOttoSessaoEstado(empresaId, sessaoId, "ingestao")
  revalidatePath(path(projetoId))
}

export async function removerDocumentoOtto(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const projetoId = formData.get("projetoId") as string
  await deleteOttoDocumento(empresaId, id)
  revalidatePath(path(projetoId))
}

export async function processarLeituraTecnicaOtto(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const sessaoId = formData.get("sessaoId") as string
  const projetoId = formData.get("projetoId") as string
  const sessao = await getOttoSessaoById(empresaId, sessaoId)
  if (!sessao || sessao.projetoId !== projetoId || sessao.documentos.length === 0) return

  await updateOttoSessaoEstado(empresaId, sessaoId, "leitura_tecnica")

  const docTextos = sessao.documentos
    .map((d, i) => `Documento ${i + 1}: ${d.titulo}\n${d.conteudo ?? d.url ?? ""}`)
    .join("\n\n")

  const prompt = `Voce e o Otto, copiloto de orcamentacao de obras da EVIS.

Analise os documentos de um projeto de construcao civil e retorne JSON puro.

Regras:
- Maximo 10 perguntas HITL.
- Pergunte somente o que muda custo, prazo, escopo ou responsabilidade.
- Nao invente dados.
- Separe fato de inferencia no texto.
- Nao use markdown.

Documentos do projeto:
${docTextos}`

  let leitura: Record<string, unknown> = {
    resumo: "Nao foi possivel processar os documentos automaticamente.",
    achados: [],
    lacunas: ["Falha na leitura tecnica. Revise os documentos e tente novamente."],
    riscosIdentificados: [],
    perguntasHITL: [],
  }
  let perguntas: PerguntaHitl[] = []

  try {
    const parsed = await generateGeminiJson(prompt, leituraTecnicaSchema) as {
      resumo?: string
      achados?: string[]
      lacunas?: string[]
      riscosIdentificados?: string[]
      perguntasHITL?: PerguntaHitl[]
    }
    leitura = {
      resumo: parsed.resumo ?? "",
      achados: parsed.achados ?? [],
      lacunas: parsed.lacunas ?? [],
      riscosIdentificados: parsed.riscosIdentificados ?? [],
      perguntasHITL: parsed.perguntasHITL ?? [],
    }
    perguntas = (parsed.perguntasHITL ?? []).filter((p) => p.pergunta?.trim()).slice(0, 10)
  } catch {
    perguntas = []
  }

  await updateOttoSessaoEstado(
    empresaId,
    sessaoId,
    perguntas.length > 0 ? "aguardando_hitl_escopo" : "escopo_validado",
    JSON.stringify(leitura),
  )

  if (perguntas.length > 0) {
    await createOttoDecisoes(
      empresaId,
      sessaoId,
      perguntas.map((p, i) => ({ pergunta: p.pergunta, impacto: p.impacto, posicao: i })),
    )
  }

  revalidatePath(path(projetoId))
}

export async function responderDecisaoOttoAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const resposta = (formData.get("resposta") as string)?.trim()
  const sessaoId = formData.get("sessaoId") as string
  const projetoId = formData.get("projetoId") as string
  if (!resposta) return

  await responderOttoDecisao(empresaId, id, resposta)
  const pendentes = await countDecisoesPendentes(empresaId, sessaoId)
  if (pendentes === 0) {
    await updateOttoSessaoEstado(empresaId, sessaoId, "escopo_validado")
  }
  revalidatePath(path(projetoId))
}

function flattenEAP(items: EAPItem[]) {
  const nivel1: Array<EAPItem & { nivelEAP: number; posicao: number; nome: string }> = []
  const nivel2: Array<EAPItem & { nivelEAP: number; posicao: number; nome: string; parentNome: string }> = []
  const nivel3: Array<EAPItem & { nivelEAP: number; posicao: number; nome: string; parentNome: string }> = []

  items.forEach((item, idx) => {
    if (!item.nome?.trim()) return
    const n1 = { ...item, nivelEAP: 1, posicao: item.posicao ?? idx + 1, nome: item.nome.trim() }
    nivel1.push(n1)
    ;(item.filhos ?? []).forEach((filho, fIdx) => {
      if (!filho.nome?.trim()) return
      const n2 = {
        ...filho,
        nivelEAP: 2,
        posicao: filho.posicao ?? fIdx + 1,
        nome: filho.nome.trim(),
        parentNome: n1.nome,
      }
      nivel2.push(n2)
      ;(filho.filhos ?? []).forEach((neto, nIdx) => {
        if (!neto.nome?.trim()) return
        nivel3.push({
          ...neto,
          nivelEAP: 3,
          posicao: neto.posicao ?? nIdx + 1,
          nome: neto.nome.trim(),
          parentNome: n2.nome,
        })
      })
    })
  })

  return { nivel1, nivel2, nivel3 }
}

export async function gerarEAPOtto(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const sessaoId = formData.get("sessaoId") as string
  const projetoId = formData.get("projetoId") as string
  const sessao = await getOttoSessaoById(empresaId, sessaoId)
  if (!sessao || sessao.projetoId !== projetoId) return

  await updateOttoSessaoEstado(empresaId, sessaoId, "eap_em_elaboracao")

  const docTextos = sessao.documentos
    .map((d, i) => `Documento ${i + 1}: ${d.titulo}\n${d.conteudo ?? d.url ?? ""}`)
    .join("\n\n")
  const decisoesTexto = sessao.decisoes
    .filter((d) => d.status === "respondida")
    .map((d) => `Pergunta: ${d.pergunta}\nResposta: ${d.resposta}`)
    .join("\n\n")
  const leitura = sessao.leituraTecnica ? JSON.parse(sessao.leituraTecnica) as { resumo?: string } : {}

  const prompt = `Voce e o Otto, copiloto de orcamentacao de obras da EVIS.

Gere uma Estrutura Analitica do Projeto em JSON puro.

Regras:
- Nao sugira precos, custos, margens ou BDI.
- nivelEAP 1 representa grupo/capitulo sem quantidade.
- nivelEAP 2 representa item de escopo com unidade e quantidade quando houver base.
- nivelEAP 3 so deve aparecer se for imprescindivel.
- statusEscopo deve ser incluido, excluido, opcional, pendente ou aditivo_potencial.
- natureza deve ser servico_proprio, material, equipamento, terceiro, taxa ou logistica.
- confianca deve ser alta, media ou baixa.
- Nao invente quantidade sem base documental; quando estimar, marque confianca baixa.
- Nao use markdown.

Resumo da leitura tecnica:
${leitura.resumo ?? ""}

Decisoes do responsavel:
${decisoesTexto || "Sem decisoes humanas registradas."}

Documentos:
${docTextos}`

  let itens: EAPItem[] = []
  try {
    const parsed = await generateGeminiJson(prompt, eapSchema) as { itens?: EAPItem[] }
    itens = parsed.itens ?? []
  } catch {
    itens = []
  }

  await softDeleteOttoItensEAPBySessao(empresaId, sessaoId)

  if (itens.length > 0) {
    const { nivel1, nivel2, nivel3 } = flattenEAP(itens)
    await createOttoItensEAP(empresaId, sessaoId, nivel1)

    const nivel1Db = await prisma.ottoItemEAP.findMany({
      where: { sessaoId, empresaId, nivelEAP: 1, deletedAt: null },
      select: { id: true, nome: true },
      orderBy: { posicao: "asc" },
      take: 100,
    })
    const nivel1Ids = Object.fromEntries(nivel1Db.map((n) => [n.nome, n.id]))

    await createOttoItensEAP(
      empresaId,
      sessaoId,
      nivel2.map((i) => ({ ...i, parentId: nivel1Ids[i.parentNome] })),
    )

    const nivel2Db = await prisma.ottoItemEAP.findMany({
      where: { sessaoId, empresaId, nivelEAP: 2, deletedAt: null },
      select: { id: true, nome: true },
      orderBy: { posicao: "asc" },
      take: 150,
    })
    const nivel2Ids = Object.fromEntries(nivel2Db.map((n) => [n.nome, n.id]))

    await createOttoItensEAP(
      empresaId,
      sessaoId,
      nivel3.map((i) => ({ ...i, parentId: nivel2Ids[i.parentNome] })),
    )
  }

  await updateOttoSessaoEstado(empresaId, sessaoId, "aguardando_hitl_eap")
  revalidatePath(path(projetoId))
}

export async function toggleAprovarItemEAP(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const id = formData.get("id") as string
  const aprovado = formData.get("aprovado") === "true"
  const projetoId = formData.get("projetoId") as string
  await updateOttoItemEAP(empresaId, id, { aprovado: !aprovado })
  revalidatePath(path(projetoId))
}

export async function aprovarEAPEPopularOrcamento(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")
  const empresaId = getEmpresaId(session)
  const sessaoId = formData.get("sessaoId") as string
  const projetoId = formData.get("projetoId") as string

  const itensAprovados = await prisma.ottoItemEAP.findMany({
    where: { sessaoId, empresaId, aprovado: true, exportado: false, deletedAt: null },
    orderBy: [{ nivelEAP: "asc" }, { posicao: "asc" }, { createdAt: "asc" }],
    take: 200,
  })
  if (itensAprovados.length === 0) return

  const eapToOrcamento: Record<string, string> = {}
  const niveis = itensAprovados.filter((i) => i.nivelEAP === 1)
  for (let idx = 0; idx < niveis.length; idx++) {
    const item = niveis[idx]
    const criado = await createItemOrcamento(empresaId, {
      projetoId,
      tipo: "nivel",
      nome: item.nome,
      posicao: idx,
      statusItem: "para_aprovar",
    })
    eapToOrcamento[item.id] = criado.id
  }

  const subniveis = itensAprovados.filter((i) => i.nivelEAP === 2 && itensAprovados.some((p) => p.id === i.parentId && p.nivelEAP === 1))
  for (let idx = 0; idx < subniveis.length; idx++) {
    const item = subniveis[idx]
    const parentId = item.parentId ? eapToOrcamento[item.parentId] : undefined
    const criado = await createItemOrcamento(empresaId, {
      projetoId,
      tipo: "composicao",
      nome: item.nome,
      parentId,
      posicao: idx,
      grupo: item.natureza ?? undefined,
      unidade: item.unidade ?? undefined,
      quantidade: item.quantidade != null ? Number(item.quantidade) : undefined,
      statusItem: "para_aprovar",
    })
    eapToOrcamento[item.id] = criado.id
  }

  const composicoes = itensAprovados.filter((i) => i.nivelEAP === 3 || !eapToOrcamento[i.id])
  for (let idx = 0; idx < composicoes.length; idx++) {
    const item = composicoes[idx]
    const parentId = item.parentId ? eapToOrcamento[item.parentId] : undefined
    if (!parentId && item.nivelEAP === 3) continue
    const criado = await createItemOrcamento(empresaId, {
      projetoId,
      tipo: "composicao",
      nome: item.nome,
      parentId,
      posicao: idx,
      grupo: item.natureza ?? undefined,
      unidade: item.unidade ?? undefined,
      quantidade: item.quantidade != null ? Number(item.quantidade) : undefined,
      statusItem: "para_aprovar",
    })
    eapToOrcamento[item.id] = criado.id
  }

  await marcarEAPExportada(empresaId, sessaoId)
  await updateOttoSessaoEstado(empresaId, sessaoId, "aprovado")
  revalidatePath(path(projetoId))
}
