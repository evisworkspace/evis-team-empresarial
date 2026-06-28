import { Decimal } from "@prisma/client/runtime/library"
import { prisma } from "@/lib/prisma"

export function createOttoSessao(empresaId: string, projetoId: string) {
  return prisma.ottoSessao.create({
    data: { empresaId, projetoId, estado: "rascunho" },
  })
}

export function getOttoSessaoAtiva(empresaId: string, projetoId: string) {
  return prisma.ottoSessao.findFirst({
    where: { empresaId, projetoId, deletedAt: null, estado: { not: "encerrado" } },
    orderBy: { createdAt: "desc" },
    include: {
      documentos: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 50,
      },
      decisoes: {
        where: { deletedAt: null },
        orderBy: [{ posicao: "asc" }, { createdAt: "asc" }],
        take: 50,
      },
      itensEAP: {
        where: { deletedAt: null },
        orderBy: [{ nivelEAP: "asc" }, { posicao: "asc" }, { createdAt: "asc" }],
        take: 200,
      },
    },
  })
}

export function getOttoSessaoById(empresaId: string, sessaoId: string) {
  return prisma.ottoSessao.findFirst({
    where: { id: sessaoId, empresaId, deletedAt: null },
    include: {
      documentos: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 50,
      },
      decisoes: {
        where: { deletedAt: null },
        orderBy: [{ posicao: "asc" }, { createdAt: "asc" }],
        take: 50,
      },
      itensEAP: {
        where: { deletedAt: null },
        orderBy: [{ nivelEAP: "asc" }, { posicao: "asc" }, { createdAt: "asc" }],
        take: 200,
      },
    },
  })
}

export function updateOttoSessaoEstado(
  empresaId: string,
  id: string,
  estado: string,
  leituraTecnica?: string,
) {
  return prisma.ottoSessao.updateMany({
    where: { id, empresaId, deletedAt: null },
    data: { estado, ...(leituraTecnica !== undefined ? { leituraTecnica } : {}) },
  })
}

export function encerrarOttoSessao(empresaId: string, id: string) {
  return prisma.ottoSessao.updateMany({
    where: { id, empresaId, deletedAt: null },
    data: { estado: "encerrado", deletedAt: new Date() },
  })
}

export function createOttoDocumento(
  empresaId: string,
  sessaoId: string,
  data: { tipo: string; titulo: string; conteudo?: string; url?: string },
) {
  return prisma.ottoDocumento.create({
    data: { empresaId, sessaoId, ...data },
  })
}

export function deleteOttoDocumento(empresaId: string, id: string) {
  return prisma.ottoDocumento.updateMany({
    where: { id, empresaId, deletedAt: null },
    data: { deletedAt: new Date() },
  })
}

export function createOttoDecisoes(
  empresaId: string,
  sessaoId: string,
  perguntas: Array<{ pergunta: string; impacto?: string; posicao: number }>,
) {
  if (perguntas.length === 0) return Promise.resolve({ count: 0 })
  return prisma.ottoDecisao.createMany({
    data: perguntas.map((p) => ({ empresaId, sessaoId, ...p })),
  })
}

export function responderOttoDecisao(empresaId: string, id: string, resposta: string) {
  return prisma.ottoDecisao.updateMany({
    where: { id, empresaId, deletedAt: null },
    data: { resposta, status: "respondida", respondidaEm: new Date() },
  })
}

export function countDecisoesPendentes(empresaId: string, sessaoId: string) {
  return prisma.ottoDecisao.count({
    where: { empresaId, sessaoId, status: "pendente", deletedAt: null },
  })
}

export function softDeleteOttoItensEAPBySessao(empresaId: string, sessaoId: string) {
  return prisma.ottoItemEAP.updateMany({
    where: { empresaId, sessaoId, deletedAt: null },
    data: { deletedAt: new Date() },
  })
}

export function createOttoItensEAP(
  empresaId: string,
  sessaoId: string,
  itens: Array<{
    parentId?: string
    posicao: number
    nivelEAP: number
    nome: string
    descricao?: string | null
    unidade?: string | null
    quantidade?: number | null
    statusEscopo?: string | null
    natureza?: string | null
    confianca?: string | null
    fonte?: string | null
  }>,
) {
  if (itens.length === 0) return Promise.resolve({ count: 0 })
  return prisma.ottoItemEAP.createMany({
    data: itens.map((i) => ({
      empresaId,
      sessaoId,
      parentId: i.parentId,
      posicao: i.posicao,
      nivelEAP: i.nivelEAP,
      nome: i.nome,
      descricao: i.descricao,
      unidade: i.unidade,
      quantidade: i.quantidade != null ? new Decimal(i.quantidade) : undefined,
      statusEscopo: i.statusEscopo,
      natureza: i.natureza,
      confianca: i.confianca,
      fonte: i.fonte,
    })),
  })
}

export function updateOttoItemEAP(
  empresaId: string,
  id: string,
  data: { nome?: string; descricao?: string | null; aprovado?: boolean; statusEscopo?: string | null },
) {
  return prisma.ottoItemEAP.updateMany({
    where: { id, empresaId, deletedAt: null },
    data,
  })
}

export function marcarEAPExportada(empresaId: string, sessaoId: string) {
  return prisma.ottoItemEAP.updateMany({
    where: { sessaoId, empresaId, aprovado: true, deletedAt: null },
    data: { exportado: true },
  })
}
