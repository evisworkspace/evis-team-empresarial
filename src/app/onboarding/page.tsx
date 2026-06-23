import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { criarEmpresaOnboarding } from "@/actions/onboarding";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session) redirect("/api/auth/signin");
  if (!session.user.onboardingPending) redirect("/dashboard");

  const userName = session.user.name?.split(" ")[0] ?? "Usuário";

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="onboarding-logo">EVIS</div>

        <h1 className="onboarding-title">Bem-vindo, {userName}!</h1>
        <p className="onboarding-sub">
          Para começar, informe o nome da sua empresa construtora.
          Você poderá alterar isso depois.
        </p>

        <form action={criarEmpresaOnboarding}>
          <div className="form-group">
            <label className="form-label" htmlFor="nomeEmpresa">
              Nome da empresa
            </label>
            <input
              id="nomeEmpresa"
              name="nomeEmpresa"
              type="text"
              required
              autoFocus
              placeholder="Ex: Construtora Silva Ltda"
              className="form-input"
              minLength={2}
              maxLength={120}
            />
            <span className="form-hint">
              Razão social, nome fantasia ou apelido — como você preferir.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          >
            Criar empresa e entrar
          </button>
        </form>
      </div>
    </div>
  );
}
