import { prisma } from "@/lib/prisma";

export type StatusProjetoData = {
  id: string;
  slug: string;
  label: string;
  cor: string;
  ordem: number;
  ativo: boolean;
};

const DEFAULTS_OPORTUNIDADE: Omit<StatusProjetoData, "id">[] = [
  { slug: "novo",             label: "Agendar Visita",   cor: "#0ea5e9", ordem: 1, ativo: true },
  { slug: "fila_espera",      label: "Fila Espera",      cor: "#7c3aed", ordem: 2, ativo: true },
  { slug: "em_andamento",     label: "Em andamento",     cor: "#059669", ordem: 3, ativo: true },
  { slug: "proposta_enviada", label: "Proposta enviada", cor: "#d97706", ordem: 4, ativo: true },
  { slug: "em_negociacao",    label: "Em negociação",    cor: "#dc2626", ordem: 5, ativo: true },
  { slug: "ganho",            label: "Ganho",            cor: "#10b981", ordem: 6, ativo: false },
  { slug: "perdido",          label: "Arquivado",        cor: "#6b7280", ordem: 7, ativo: false },
];

const DEFAULTS_OBRA: Omit<StatusProjetoData, "id">[] = [
  { slug: "abertura",     label: "Abertura",     cor: "#3b82f6", ordem: 1, ativo: true },
  { slug: "planejamento", label: "Planejamento",  cor: "#8b5cf6", ordem: 2, ativo: true },
  { slug: "em_andamento", label: "Em andamento",  cor: "#f97316", ordem: 3, ativo: true },
  { slug: "pausada",      label: "Pausada",       cor: "#eab308", ordem: 4, ativo: true },
  { slug: "concluida",    label: "Concluída",     cor: "#10b981", ordem: 5, ativo: true },
  { slug: "entregue",     label: "Entregue",      cor: "#64748b", ordem: 6, ativo: false },
  { slug: "encerrada",    label: "Encerrada",     cor: "#ef4444", ordem: 7, ativo: false },
];

const SEL = { id: true, slug: true, label: true, cor: true, ordem: true, ativo: true } as const;

export async function getOrSeedStatuses(
  empresaId: string,
  stage: string,
): Promise<StatusProjetoData[]> {
  const existing = await prisma.statusProjeto.findMany({
    where: { empresaId, stage },
    select: SEL,
    orderBy: { ordem: "asc" },
    take: 50,
  });

  if (existing.length > 0) return existing;

  const defaults = stage === "obra" ? DEFAULTS_OBRA : DEFAULTS_OPORTUNIDADE;
  await prisma.statusProjeto.createMany({
    data: defaults.map((d) => ({ ...d, empresaId, stage })),
    skipDuplicates: true,
  });

  return prisma.statusProjeto.findMany({
    where: { empresaId, stage },
    select: SEL,
    orderBy: { ordem: "asc" },
    take: 50,
  });
}

export async function createStatusProjeto(
  empresaId: string,
  stage: string,
  label: string,
  cor: string,
  ativo: boolean,
): Promise<void> {
  const slug = `custom_${label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 30)}_${Date.now().toString(36)}`;

  const maxOrdem = await prisma.statusProjeto.aggregate({
    where: { empresaId, stage },
    _max: { ordem: true },
  });

  const ordem = (maxOrdem._max.ordem ?? 0) + 1;

  await prisma.statusProjeto.create({
    data: { empresaId, stage, slug, label, cor, ordem, ativo },
  });
}

export async function updateStatusLabel(
  empresaId: string,
  id: string,
  label: string,
): Promise<void> {
  await prisma.statusProjeto.updateMany({
    where: { id, empresaId },
    data: { label },
  });
}

export async function updateStatusCor(
  empresaId: string,
  id: string,
  cor: string,
): Promise<void> {
  await prisma.statusProjeto.updateMany({
    where: { id, empresaId },
    data: { cor },
  });
}

export async function toggleStatusAtivo(
  empresaId: string,
  id: string,
): Promise<void> {
  const current = await prisma.statusProjeto.findFirst({
    where: { id, empresaId },
    select: { ativo: true },
  });
  if (!current) return;
  await prisma.statusProjeto.updateMany({
    where: { id, empresaId },
    data: { ativo: !current.ativo },
  });
}

export async function moveStatusOrdem(
  empresaId: string,
  id: string,
  direction: "up" | "down",
): Promise<void> {
  const current = await prisma.statusProjeto.findFirst({
    where: { id, empresaId },
    select: { id: true, stage: true, ordem: true, ativo: true },
  });
  if (!current) return;

  const neighbor = await prisma.statusProjeto.findFirst({
    where: {
      empresaId,
      stage: current.stage,
      ativo: current.ativo,
      ordem: direction === "up" ? { lt: current.ordem } : { gt: current.ordem },
    },
    orderBy: { ordem: direction === "up" ? "desc" : "asc" },
    select: { id: true, ordem: true },
  });
  if (!neighbor) return;

  await prisma.$transaction([
    prisma.statusProjeto.updateMany({ where: { id: current.id }, data: { ordem: neighbor.ordem } }),
    prisma.statusProjeto.updateMany({ where: { id: neighbor.id }, data: { ordem: current.ordem } }),
  ]);
}

export async function deleteStatusProjeto(
  empresaId: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const status = await prisma.statusProjeto.findFirst({
    where: { id, empresaId },
    select: { slug: true, stage: true },
  });
  if (!status) return { ok: false, error: "Status não encontrado." };

  const inUse = await prisma.projeto.count({
    where: {
      empresaId,
      stage: status.stage,
      statusInterno: status.slug,
      deletedAt: null,
    },
  });
  if (inUse > 0) {
    return { ok: false, error: `Ainda há ${inUse} projeto(s) com este status. Mova-os antes de excluir.` };
  }

  await prisma.statusProjeto.deleteMany({ where: { id, empresaId } });
  return { ok: true };
}
