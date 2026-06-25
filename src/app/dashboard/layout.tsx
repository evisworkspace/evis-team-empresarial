import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getEmpresaById } from "@/data/empresa";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/api/auth/signin");
  if (session.user.onboardingPending) redirect("/onboarding");

  const empresaId = getEmpresaId(session);
  const empresa = await getEmpresaById(empresaId);

  const userName = session.user.name ?? session.user.email ?? "Usuário";
  const companyName = empresa?.nome ?? "Empresa";

  return (
    <DashboardShell userName={userName} companyName={companyName}>
      {children}
    </DashboardShell>
  );
}
