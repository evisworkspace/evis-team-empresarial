// Helper de rastreio/auditoria (Lote 3C).
// createAuditEntry é o ÚNICO ponto de escrita do rastreio_auditoria.
// A tabela é append-only (proteção em src/lib/prisma.ts): só INSERT, nunca update/delete.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditEntryInput = {
  empresaId: string;
  /** domínio: criacao | edicao | validacao_ia | rejeicao_ia | conversao_stage | alteracao_status | alteracao_financeiro */
  eventoTipo: string;
  /** tipo da entidade afetada, ex.: 'cliente' | 'projeto' | 'tarefa' */
  entidadeTipo: string;
  entidadeId: string;
  /** id do usuario EVIS (HITL). null quando o evento é gerado pelo sistema. */
  usuarioId?: string | null;
  projetoId?: string | null;
  conteudoSugeridoIa?: Prisma.InputJsonValue | null;
  conteudoPersistido: Prisma.InputJsonValue;
  origemInformacao?: string | null;
};

/** Registra um evento de auditoria (append-only). Único ponto de escrita do rastreio. */
export function createAuditEntry(input: AuditEntryInput) {
  return prisma.rastreioAuditoria.create({
    data: {
      empresaId: input.empresaId,
      projetoId: input.projetoId ?? null,
      entidadeAfetadaTipo: input.entidadeTipo,
      entidadeAfetadaId: input.entidadeId,
      eventoTipo: input.eventoTipo,
      usuarioId: input.usuarioId ?? null,
      conteudoPersistido: input.conteudoPersistido,
      origemInformacao: input.origemInformacao ?? null,
      ...(input.conteudoSugeridoIa != null
        ? { conteudoSugeridoIa: input.conteudoSugeridoIa }
        : {}),
    },
  });
}
