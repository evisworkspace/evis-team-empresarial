import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getConviteByToken } from "@/data/configuracoes"
import { aceitarConviteAction } from "@/actions/configuracoes"

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const convite = await getConviteByToken(token)

  if (!convite || convite.usedAt || new Date() > convite.expiresAt) {
    return (
      <div className="convite-page">
        <div className="convite-card">
          <div className="convite-logo">E</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Link inválido</h1>
          <p style={{ color: "var(--clr-text-secondary)", fontSize: 14 }}>
            Este convite expirou ou já foi utilizado.
          </p>
        </div>
      </div>
    )
  }

  const session = await auth()

  if (!session?.user) {
    redirect(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(`/convite/${token}`)}`)
  }

  if (session.user.email?.toLowerCase() !== convite.email.toLowerCase()) {
    return (
      <div className="convite-page">
        <div className="convite-card">
          <div className="convite-logo">E</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>E-mail diferente</h1>
          <p style={{ color: "var(--clr-text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
            Este convite é para <strong>{convite.email}</strong>.<br />
            Você está conectado como <strong>{session.user.email}</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="convite-page">
      <div className="convite-card">
        <div className="convite-logo">E</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
          Você foi convidado
        </h1>
        <p style={{ color: "var(--clr-text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          Junte-se à equipe <strong style={{ color: "var(--clr-text)" }}>{convite.empresa.nome}</strong> no EVIS Team Empresarial.
        </p>
        <form action={aceitarConviteAction}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Aceitar e entrar
          </button>
        </form>
      </div>
    </div>
  )
}
