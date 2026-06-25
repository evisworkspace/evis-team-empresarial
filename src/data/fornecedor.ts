import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 50;

export function listFornecedoresByEmpresa(
  empresaId: string,
  opts?: { tipo?: string; take?: number; skip?: number; q?: string },
) {
  return prisma.fornecedor.findMany({
    where: {
      empresaId,
      deletedAt: null,
      ...(opts?.tipo ? { tipo: opts.tipo } : {}),
      ...(opts?.q ? { nome: { contains: opts.q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? DEFAULT_PAGE_SIZE,
    skip: opts?.skip ?? 0,
  });
}

export function getFornecedorByEmpresa(empresaId: string, fornecedorId: string) {
  return prisma.fornecedor.findFirst({
    where: { id: fornecedorId, empresaId, deletedAt: null },
  });
}

export function countFornecedoresByEmpresa(empresaId: string) {
  return prisma.fornecedor.count({
    where: { empresaId, deletedAt: null },
  });
}

type FornecedorFields = {
  nome?: string;
  contato?: string | null;
  tipo?: string;
  tipoPessoa?: string;
  razaoSocial?: string;
  cpfCnpj?: string;
  categorias?: string;
  email?: string;
  telefone?: string;
  site?: string;
  nomeResponsavel?: string;
  nomeContato?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
};

export function updateFornecedor(
  empresaId: string,
  fornecedorId: string,
  data: FornecedorFields,
) {
  return prisma.fornecedor.updateMany({
    where: { id: fornecedorId, empresaId, deletedAt: null },
    data,
  });
}

export function createFornecedor(
  empresaId: string,
  data: { nome: string; tipo: string } & FornecedorFields,
) {
  return prisma.fornecedor.create({
    data: {
      empresaId,
      nome: data.nome,
      contato: data.contato,
      tipo: data.tipo,
      tipoPessoa: data.tipoPessoa,
      razaoSocial: data.razaoSocial,
      cpfCnpj: data.cpfCnpj,
      categorias: data.categorias,
      email: data.email,
      telefone: data.telefone,
      site: data.site,
      nomeResponsavel: data.nomeResponsavel,
      nomeContato: data.nomeContato,
      cep: data.cep,
      rua: data.rua,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      status: "ativo",
    },
  });
}
