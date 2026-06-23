import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const redirectToSignIn = (request: NextRequest, callbackPath: string) => {
  const signInUrl = new URL("/api/auth/signin", request.url);
  signInUrl.searchParams.set(
    "callbackUrl",
    new URL(callbackPath, request.url).toString(),
  );
  return NextResponse.redirect(signInUrl);
};

// Responsabilidade do proxy:
// 1. Redirecionar a raiz "/" para o destino correto (signin / onboarding / dashboard).
// 2. Impedir acesso a /dashboard/* sem sessão (atalho rápido, sem DB).
// 3. Redirecionar /onboarding para /dashboard se o token já tiver empresaId.
//
// O proxy NÃO tenta inferir onboardingPending a partir do token para rotas
// como /dashboard — essa verificação fica nos layouts que chamam auth() e
// re-buscam no banco, quebrando o possível loop JWT-desatualizado ↔ redirect.

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas que nunca entram na lógica — garantia dupla além do matcher.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isAuthenticated = !!token;
  const empresaId = (token?.empresaId as string | null | undefined) ?? null;

  // --- RAIZ "/" ---
  // Único ponto onde o proxy decide o fluxo completo de entrada.
  if (pathname === "/") {
    if (!isAuthenticated) {
      return redirectToSignIn(request, "/onboarding");
    }
    if (empresaId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // --- /onboarding ---
  // Se o token JÁ tem empresa, redirecionar para o dashboard.
  // Se não tem (ou não autenticado), deixar a página renderizar e cuidar da lógica.
  if (pathname === "/onboarding") {
    if (!isAuthenticated) {
      return redirectToSignIn(request, "/onboarding");
    }
    if (isAuthenticated && empresaId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // --- /dashboard/* ---
  // Sem sessão: atalho para signin (evita carregar o layout inteiro sem sentido).
  // COM sessão mas empresaId ainda null no token: DEIXAR PASSAR para o layout,
  // que chama auth() e obtém a sessão atualizada via DB re-fetch.
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      return redirectToSignIn(
        request,
        `${pathname}${request.nextUrl.search}`,
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
