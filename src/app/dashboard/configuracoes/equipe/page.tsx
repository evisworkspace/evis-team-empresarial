import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { getMembros } from "@/data/configuracoes"
import { ConviteForm } from "@/components/configuracoes/ConviteForm"

export const metadata: Metadata = { title: "Equipe" }

function perfilLabel(p: string) {
  if (p === "admin") return "Admin"
  return "Membro"
}

function perfilBadgeClass(p: string) {
  return p === "admin" ? "badge badge-admin" : "badge badge-membro"
}

export default async function EquipePage() {
  const session = await auth()
  const empresaId = getEmpresaId(session!)
  const membros = await getMembros(empresaId)

  return (
    <div className="form-card" style={{ maxWidth: 700 }}>
      <ConviteForm />

      {membros.length === 0 ? (
        <p style={{ color: "var(--clr-text-muted)", fontSize: 13.5, marginTop: 24 }}>
          Nenhum membro encontrado.
        </p>
      ) : (
        <table className="team-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Permissão</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {membros.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.nome}</td>
                <td style={{ color: "var(--clr-text-secondary)" }}>{m.email}</td>
                <td>
                  <span className={perfilBadgeClass(m.perfil)}>
                    {perfilLabel(m.perfil)}
                  </span>
                </td>
                <td>
                  <span className={m.status === "ativo" ? "badge badge-ativo" : "badge badge-inativo"}>
                    {m.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
