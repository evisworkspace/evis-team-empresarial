// Singleton do Prisma Client com proteção append-only do rastreio (Lote 3C).
// O $extends intercepta e BLOQUEIA update/updateMany/delete/deleteMany em
// rastreio_auditoria (A2/A3). create e read continuam permitidos.
// Padrão $extends validado via Context7 (Despacho 006 ponto 3).
import { PrismaClient } from "@prisma/client";

/** Lançado ao tentar mutar/excluir um registro de rastreio_auditoria (imutável). */
export class RastreioImutavelError extends Error {
  constructor(operacao: string) {
    super(
      `Operação "${operacao}" proibida em rastreio_auditoria: a trilha é append-only (imutável).`,
    );
    this.name = "RastreioImutavelError";
  }
}

const createPrismaClient = () =>
  new PrismaClient().$extends({
    query: {
      rastreioAuditoria: {
        update() {
          throw new RastreioImutavelError("update");
        },
        updateMany() {
          throw new RastreioImutavelError("updateMany");
        },
        delete() {
          throw new RastreioImutavelError("delete");
        },
        deleteMany() {
          throw new RastreioImutavelError("deleteMany");
        },
      },
    },
  });

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
