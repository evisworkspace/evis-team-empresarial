// Augmentação de tipos do Auth.js v5 — adiciona empresaId e onboardingPending.
// Sem isto, session.user.empresaId e token.empresaId não tipam.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Auth.js User.id — vem de token.sub. Nunca nulo para sessão válida. */
      id: string;
      /** Tenant do usuário. null enquanto não houver vínculo válido (onboarding). */
      empresaId: string | null;
      /** true quando não há empresaId vinculado — usuário deve passar pelo onboarding. */
      onboardingPending: boolean;
    } & DefaultSession["user"];
  }

  // User do adapter — carrega empresaId (pode ser null até o onboarding).
  interface User {
    empresaId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    empresaId?: string | null;
  }
}
