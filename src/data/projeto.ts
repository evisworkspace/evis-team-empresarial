// Camada de dados — Projeto (Lote 3B).
// REGRA: toda função tenant-owned recebe `empresaId` como primeiro parâmetro
// obrigatório por assinatura (A5). Nenhuma query sem filtro de empresa.
// Nenhuma query Prisma deve existir fora de src/data/.
import { prisma } from "@/lib/prisma";

// Limite explícito em listagens (regra de cache/performance: nunca query sem limite).
const DEFAULT_PAGE_SIZE = 50;

export function listProjetosByEmpresa(
  empresaId: string,
  opts?: { stage?: string; take?: number; skip?: number },
) {
  return prisma.projeto.findMany({
    where: {
      empresaId,
      deletedAt: null,
      ...(opts?.stage ? { stage: opts.stage } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? DEFAULT_PAGE_SIZE,
    skip: opts?.skip ?? 0,
  });
}

export function getProjetoByEmpresa(empresaId: string, projetoId: string) {
  return prisma.projeto.findFirst({
    where: { id: projetoId, empresaId, deletedAt: null },
    include: { cliente: true },
  });
}

export function countProjetosByEmpresa(
  empresaId: string,
  stage?: string,
  opts?: { excludeStatusInterno?: string; excludeStatusInternoList?: string[]; statusInternoIn?: string[] },
) {
  return prisma.projeto.count({
    where: {
      empresaId,
      deletedAt: null,
      ...(stage ? { stage } : {}),
      ...(opts?.statusInternoIn && opts.statusInternoIn.length > 0
        ? { statusInterno: { in: opts.statusInternoIn } }
        : opts?.excludeStatusInternoList && opts.excludeStatusInternoList.length > 0
        ? { statusInterno: { notIn: opts.excludeStatusInternoList } }
        : opts?.excludeStatusInterno
        ? { statusInterno: { not: opts.excludeStatusInterno } }
        : {}),
    },
  });
}

export function listProjetosByEmpresaWithCliente(
  empresaId: string,
  opts?: { stage?: string; take?: number; skip?: number; excludeStatusInterno?: string; excludeStatusInternoList?: string[]; statusInternoIn?: string[]; q?: string },
) {
  return prisma.projeto.findMany({
    where: {
      empresaId,
      deletedAt: null,
      ...(opts?.stage ? { stage: opts.stage } : {}),
      ...(opts?.statusInternoIn && opts.statusInternoIn.length > 0
        ? { statusInterno: { in: opts.statusInternoIn } }
        : opts?.excludeStatusInternoList && opts.excludeStatusInternoList.length > 0
        ? { statusInterno: { notIn: opts.excludeStatusInternoList } }
        : opts?.excludeStatusInterno
        ? { statusInterno: { not: opts.excludeStatusInterno } }
        : {}),
      ...(opts?.q
        ? {
            OR: [
              { titulo: { contains: opts.q, mode: "insensitive" as const } },
              { numeroObra: { contains: opts.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: { cliente: { select: { id: true, nome: true } } },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? DEFAULT_PAGE_SIZE,
    skip: opts?.skip ?? 0,
  });
}

export async function nextCodigoSequencial(empresaId: string): Promise<string> {
  const ano = new Date().getFullYear();
  const ultimo = await prisma.projeto.findFirst({
    where: { empresaId, codigoSequencial: { startsWith: `${ano}-` } },
    orderBy: { codigoSequencial: "desc" },
    select: { codigoSequencial: true },
  });
  const seq = ultimo
    ? String(Number(ultimo.codigoSequencial!.split("-")[1]) + 1).padStart(3, "0")
    : "001";
  return `${ano}-${seq}`;
}

export async function createProjeto(
  empresaId: string,
  data: {
    clienteId: string;
    titulo: string;
    descricao?: string;
    stage: string;
    statusInterno: string;
    origem?: string;
    tipoObra?: string;
    prioridade?: string;
    metragemEstimada?: number;
    valorEstimado?: number;
    valorGanhoEstimativa?: number;
    enderecoObra?: string;
    dataInicioEstimada?: Date;
    numeroObra?: string;
    dataDeGanho?: Date;
    cepObra?: string;
    logradouroObra?: string;
    numeroEnderecoObra?: string;
    complementoObra?: string;
    bairroObra?: string;
    cidadeObra?: string;
    estadoObra?: string;
  },
) {
  const codigoSequencial = await nextCodigoSequencial(empresaId);
  return prisma.projeto.create({
    data: {
      empresaId,
      codigoSequencial,
      clienteId: data.clienteId,
      titulo: data.titulo,
      descricao: data.descricao,
      stage: data.stage,
      statusInterno: data.statusInterno,
      origem: data.origem,
      tipoObra: data.tipoObra,
      prioridade: data.prioridade,
      metragemEstimada: data.metragemEstimada,
      valorEstimado: data.valorEstimado,
      valorGanhoEstimativa: data.valorGanhoEstimativa,
      enderecoObra: data.enderecoObra,
      dataInicioEstimada: data.dataInicioEstimada,
      dataDeGanho: data.dataDeGanho,
      cepObra: data.cepObra,
      logradouroObra: data.logradouroObra,
      numeroEnderecoObra: data.numeroEnderecoObra,
      complementoObra: data.complementoObra,
      bairroObra: data.bairroObra,
      cidadeObra: data.cidadeObra,
      estadoObra: data.estadoObra,
      ...(data.numeroObra ? { numeroObra: data.numeroObra } : {}),
    },
  });
}

export async function updateProjeto(
  empresaId: string,
  projetoId: string,
  data: {
    clienteId?: string;
    stage?: string;
    statusInterno?: string;
    titulo?: string;
    descricao?: string | null;
    numeroObra?: string | null;
    origem?: string | null;
    tipoObra?: string | null;
    prioridade?: string | null;
    metragemEstimada?: number | null;
    valorEstimado?: number | null;
    valorGanhoEstimativa?: number | null;
    enderecoObra?: string | null;
    dataInicioEstimada?: Date | null;
    dataDeGanho?: Date | null;
    cepObra?: string | null;
    logradouroObra?: string | null;
    numeroEnderecoObra?: string | null;
    complementoObra?: string | null;
    bairroObra?: string | null;
    cidadeObra?: string | null;
    estadoObra?: string | null;
  },
) {
  return prisma.projeto.updateMany({
    where: { id: projetoId, empresaId, deletedAt: null },
    data,
  });
}

export async function sumValorEstimadoByEmpresa(
  empresaId: string,
  opts?: { excludeStatusInterno?: string },
) {
  const result = await prisma.projeto.aggregate({
    where: {
      empresaId,
      stage: "oportunidade",
      deletedAt: null,
      ...(opts?.excludeStatusInterno
        ? { statusInterno: { not: opts.excludeStatusInterno } }
        : {}),
    },
    _sum: { valorEstimado: true },
  });
  return Number(result._sum.valorEstimado ?? 0);
}

export async function softDeleteProjeto(empresaId: string, projetoId: string) {
  return prisma.projeto.updateMany({
    where: { id: projetoId, empresaId, deletedAt: null },
    data: { deletedAt: new Date() },
  })
}

export async function hardDeleteProjeto(empresaId: string, projetoId: string) {
  return prisma.$transaction([
    // MedicaoItem referencia Medicao e ProjetoItemOrcamento — deletar primeiro
    prisma.medicaoItem.deleteMany({
      where: { medicao: { projetoId, empresaId } },
    }),
    prisma.medicao.deleteMany({ where: { projetoId, empresaId } }),
    // Quebrar auto-referência parent/child antes de deletar
    prisma.projetoItemOrcamento.updateMany({
      where: { projetoId, empresaId },
      data: { parentId: null },
    }),
    prisma.projetoItemOrcamento.deleteMany({ where: { projetoId, empresaId } }),
    prisma.lancamentoFinanceiro.deleteMany({ where: { projetoId, empresaId } }),
    prisma.tarefa.deleteMany({ where: { projetoId, empresaId } }),
    prisma.projetoAtividade.deleteMany({ where: { projetoId, empresaId } }),
    prisma.anotacao.deleteMany({ where: { projetoId, empresaId } }),
    prisma.rastreioAuditoria.deleteMany({ where: { projetoId, empresaId } }),
    prisma.projeto.deleteMany({ where: { id: projetoId, empresaId } }),
  ]);
}

export function getProjetoWithDetails(empresaId: string, projetoId: string) {
  return prisma.projeto.findFirst({
    where: { id: projetoId, empresaId, deletedAt: null },
    include: {
      cliente: { select: { id: true, nome: true, telefone: true, origemContato: true, tipoPessoa: true } },
      tarefas: {
        where: { deletedAt: null },
        orderBy: [
          { dataPrevista: { sort: "asc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        take: 20,
      },
      lancamentos: {
        where: { deletedAt: null },
        include: {
          categoriaFinanceira: { select: { id: true, nome: true } },
          centroDeCusto: { select: { id: true, nome: true } },
          fornecedor: { select: { id: true, nome: true } },
        },
        orderBy: { dataVencimento: "asc" },
        take: 20,
      },
      rastreios: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      atividades: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      anotacoes: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      diariosObra: {
        orderBy: { data: "desc" },
        take: 10,
        include: {
          itensHITL: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
}
