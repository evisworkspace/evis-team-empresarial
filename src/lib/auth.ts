// Configuração do Auth.js v5 — JWT + Google + PrismaAdapter.
// Padrão validado via Context7 (next-auth@5 beta).
//
// empresaId NUNCA é inventado: só entra no token se o User tiver vínculo válido.
// Sem vínculo, a sessão fica em onboardingPending — nenhuma rota tenant-owned é liberada.
//
// Re-fetch de empresaId: se token.empresaId for null e token.sub existir, busca
// User.empresaId no banco. Isso permite que a sessão reflita o onboarding sem
// sign-out/sign-in. Ocorre no máximo uma query por request, só enquanto pendente.
//
// Google() sem args lê AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET do ambiente (convenção Auth.js v5).
// AUTH_SECRET assina o JWT. Nenhum segredo real fica em arquivo.
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [Google],
  callbacks: {
    async jwt({ token, user }) {
      // No sign-in, `user` carrega empresaId do adapter (pode ser null).
      if (user) {
        token.empresaId = user.empresaId ?? null;
      }
      // Re-fetch: se empresaId ainda null e temos identidade (token.sub = User.id),
      // busca no banco. Garante que a sessão reflita onboarding sem re-login.
      // Zero queries quando empresaId já está no token.
      if (!token.empresaId && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { empresaId: true },
        });
        if (dbUser?.empresaId) {
          token.empresaId = dbUser.empresaId;
        }
      }
      return token;
    },
    session({ session, token }) {
      const empresaId = (token.empresaId as string | null | undefined) ?? null;
      // Expõe Auth.js User.id na sessão — necessário para Server Actions de onboarding.
      session.user.id = token.sub as string;
      session.user.empresaId = empresaId;
      // Sem empresaId vinculado → onboarding pendente.
      session.user.onboardingPending = !empresaId;
      return session;
    },
  },
});
