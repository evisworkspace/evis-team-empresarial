"use server";
// Server Action de onboarding mínimo (Lote 5).
// Cria Empresa + Usuario EVIS vinculados ao Auth User em uma transação atômica.
// Atualiza User.empresaId para que o próximo JWT callback reflita o vínculo
// sem necessidade de re-login.
//
// Proteções:
// - Exige sessão autenticada (session.user.id = token.sub).
// - Exige onboardingPending: true (idempotência: usuário com empresa já → redirect).
// - Transação: se qualquer etapa falhar, nada é persistido.
// - P2002 (unique constraint): clique duplo tratado sem erro exposto ao usuário.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function criarEmpresaOnboarding(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Idempotência: se já tiver empresa, apenas segue.
  if (!session.user.onboardingPending) {
    redirect("/");
  }

  const nomeEmpresa = (formData.get("nomeEmpresa") as string | null)?.trim();
  if (!nomeEmpresa) {
    throw new Error("Nome da empresa é obrigatório.");
  }

  const authUserId = session.user.id;
  const nomeUsuario = session.user.name ?? session.user.email ?? "Usuário";
  const emailUsuario = session.user.email ?? "";

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Criar Empresa.
      const empresa = await tx.empresa.create({
        data: {
          nome: nomeEmpresa,
          tipoPessoa: "PJ",
          status: "ativo",
        },
      });

      // 2. Criar Usuario EVIS com vínculo explícito ao Auth User (decisão 9.1).
      await tx.usuario.create({
        data: {
          empresaId: empresa.id,
          nome: nomeUsuario,
          email: emailUsuario,
          perfil: "admin",
          status: "ativo",
          authUserId,
        },
      });

      // 3. Atualizar Auth User.empresaId → próximo JWT callback detecta e atualiza o token.
      await tx.user.update({
        where: { id: authUserId },
        data: { empresaId: empresa.id },
      });
    });
  } catch (error: unknown) {
    // P2002 = unique constraint — usuário já passou pelo onboarding (clique duplo).
    // Silencia e deixa redirect resolver.
    const e = error as { code?: string };
    if (e?.code !== "P2002") throw error;
  }

  redirect("/");
}
