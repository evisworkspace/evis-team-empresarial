// Helper mínimo de multi-tenancy (Lote 3B).
// Resolve o empresaId a partir da sessão validada do Auth.js.
//
// Princípios (decisões 9.1 / A5):
// - NUNCA inventa tenant. empresaId vem da sessão ou é passado explicitamente.
// - NUNCA infere empresa por email.
// - Se a sessão estiver em onboarding pendente, bloqueia operação tenant-owned.
//
// Contrato de uso: a camada superior chama getEmpresaId(session) ANTES de
// invocar qualquer função de src/data/*. Se lançar, a operação tenant-owned não acontece.
import type { Session } from "next-auth";

/** Não há usuário autenticado na sessão. */
export class UnauthenticatedError extends Error {
  constructor() {
    super("Sessão sem usuário autenticado.");
    this.name = "UnauthenticatedError";
  }
}

/** Usuário autenticado, mas sem empresa vinculada — onboarding pendente. */
export class OnboardingPendingError extends Error {
  constructor() {
    super("Usuário sem empresa vinculada — onboarding pendente.");
    this.name = "OnboardingPendingError";
  }
}

/**
 * Resolve o empresaId da sessão validada. Lança se não houver usuário
 * ou se o onboarding estiver pendente. Garante que nenhuma função
 * tenant-owned rode sem um empresaId válido e explícito.
 */
export function getEmpresaId(session: Session | null): string {
  if (!session?.user) {
    throw new UnauthenticatedError();
  }
  if (session.user.onboardingPending || !session.user.empresaId) {
    throw new OnboardingPendingError();
  }
  return session.user.empresaId;
}

/** Versão não-lançante: retorna o empresaId ou null (para checagens condicionais). */
export function tryGetEmpresaId(session: Session | null): string | null {
  if (!session?.user || session.user.onboardingPending) {
    return null;
  }
  return session.user.empresaId ?? null;
}
