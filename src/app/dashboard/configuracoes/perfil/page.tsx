import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { getUsuarioByAuthId } from "@/data/configuracoes"
import { PerfilForm } from "@/components/configuracoes/PerfilForm"

export const metadata: Metadata = { title: "Perfil" }

export default async function PerfilPage() {
  const session = await auth()
  const empresaId = getEmpresaId(session!)

  const usuario = await getUsuarioByAuthId(session!.user.id, empresaId)

  const nome = usuario?.nome ?? session!.user.name ?? ""
  const email = session!.user.email ?? ""
  const fotoUrl = usuario?.foto ?? session!.user.image ?? null

  return (
    <div className="form-card">
      <div className="form-card-title">Perfil</div>
      <p className="form-card-sub">Seus dados pessoais dentro do EVIS.</p>
      <PerfilForm
        nome={nome}
        email={email}
        cpf={usuario?.cpf ?? null}
        telefone={usuario?.telefone ?? null}
        fotoUrl={fotoUrl}
      />
    </div>
  )
}
