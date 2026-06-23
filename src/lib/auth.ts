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
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// PrismaAdapter exige o PrismaClient base — incompatível com $extends do singleton.
const prismaBase =
  (globalThis as unknown as { _prismaBase?: PrismaClient })._prismaBase ??
  new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  (globalThis as unknown as { _prismaBase: PrismaClient })._prismaBase =
    prismaBase;
}

const shouldLogOAuthDebug = process.env.AUTH_DEBUG_OAUTH === "1";

const redactAuthPayload = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redactAuthPayload);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      /token|secret|code|state|verifier/i.test(key)
        ? "[redacted]"
        : redactAuthPayload(entry),
    ]),
  );
};

const baseAdapter = PrismaAdapter(prismaBase);
const adapter = shouldLogOAuthDebug
  ? (Object.fromEntries(
    Object.entries(baseAdapter).map(([name, method]) => [
      name,
      async (...args: unknown[]) => {
        const startedAt = Date.now();
        console.info(`[auth][adapter:start] ${name}`, redactAuthPayload(args));
        try {
          const result = await (method as (...methodArgs: unknown[]) => unknown)(
            ...args,
          );
          console.info(`[auth][adapter:ok] ${name}`, {
            elapsedMs: Date.now() - startedAt,
            result: redactAuthPayload(result),
          });
          return result;
        } catch (error) {
          console.error(`[auth][adapter:error] ${name}`, error);
          throw error;
        }
      },
    ]),
  ) as typeof baseAdapter)
  : baseAdapter;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "jwt" },
  providers: [Google({ allowDangerousEmailAccountLinking: true })],
  trustHost: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (shouldLogOAuthDebug) {
        console.info("[auth][callback:signIn]", {
          user: redactAuthPayload(user),
          account: redactAuthPayload(account),
          profile: redactAuthPayload(profile),
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (shouldLogOAuthDebug) {
        console.info("[auth][callback:jwt]", {
          hasUser: !!user,
          tokenSub: token.sub ?? null,
          userId: user?.id ?? null,
          userEmail: user?.email ?? null,
        });
      }
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
      if (shouldLogOAuthDebug) {
        console.info("[auth][callback:session]", {
          tokenSub: token.sub ?? null,
          tokenEmpresaId: token.empresaId ?? null,
        });
      }
      const empresaId = (token.empresaId as string | null | undefined) ?? null;
      // Expõe Auth.js User.id na sessão — necessário para Server Actions de onboarding.
      session.user.id = token.sub as string;
      session.user.empresaId = empresaId;
      // Sem empresaId vinculado → onboarding pendente.
      session.user.onboardingPending = !empresaId;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (shouldLogOAuthDebug) {
        console.info("[auth][event:createUser]", redactAuthPayload(user));
      }
    },
    async linkAccount({ account }) {
      if (shouldLogOAuthDebug) {
        console.info("[auth][event:linkAccount]", redactAuthPayload(account));
      }
    },
    async signIn(message) {
      if (shouldLogOAuthDebug) {
        console.info("[auth][event:signIn]", redactAuthPayload(message));
      }
    },
  },
});
