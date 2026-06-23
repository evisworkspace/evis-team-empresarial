// Camada de dados — Cliente (Lote 3B).
// Mesma regra de projeto.ts: `empresaId` obrigatório por assinatura (A5),
// nenhuma query sem filtro de empresa, nenhuma query Prisma fora de src/data/.
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 50;

export function listClientesByEmpresa(
  empresaId: string,
  opts?: { take?: number; skip?: number; q?: string },
) {
  return prisma.cliente.findMany({
    where: {
      empresaId,
      deletedAt: null,
      ...(opts?.q ? { nome: { contains: opts.q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? DEFAULT_PAGE_SIZE,
    skip: opts?.skip ?? 0,
  });
}

export function getClienteByEmpresa(empresaId: string, clienteId: string) {
  return prisma.cliente.findFirst({
    where: { id: clienteId, empresaId, deletedAt: null },
    include: { projetos: { where: { deletedAt: null }, select: { id: true, titulo: true, stage: true, statusInterno: true } } },
  });
}

export function countClientesByEmpresa(empresaId: string) {
  return prisma.cliente.count({
    where: { empresaId, deletedAt: null },
  });
}

export async function updateCliente(
  empresaId: string,
  clienteId: string,
  data: { nome?: string; telefone?: string | null; tipoPessoa?: string; origemContato?: string | null },
) {
  return prisma.cliente.updateMany({
    where: { id: clienteId, empresaId, deletedAt: null },
    data,
  });
}

export function createCliente(
  empresaId: string,
  data: { nome: string; telefone?: string; tipoPessoa?: string; origemContato?: string },
) {
  return prisma.cliente.create({
    data: {
      empresaId,
      nome: data.nome,
      telefone: data.telefone,
      tipoPessoa: data.tipoPessoa ?? "PF",
      origemContato: data.origemContato,
      status: "ativo",
    },
  });
}
