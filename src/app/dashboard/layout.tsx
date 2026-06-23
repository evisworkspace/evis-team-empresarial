import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getEmpresaById } from "@/data/empresa";
import { Sidebar } from "@/components/Sidebar";

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
    <div className="app-shell">
      <Sidebar userName={userName} companyName={companyName} />

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-title">{companyName}</span>
          </div>
          <div className="topbar-right">
            <span className="env-badge env-badge--dev">
              <span className="env-badge--dot" />
              Dev
            </span>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
