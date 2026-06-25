import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { getEmpresaCompleta } from "@/data/configuracoes"
import { EmpresaForm } from "@/components/configuracoes/EmpresaForm"

export const metadata: Metadata = { title: "Empresa" }

export default async function EmpresaPage() {
  const session = await auth()
  const empresaId = getEmpresaId(session!)
  const empresa = await getEmpresaCompleta(empresaId)

  return (
    <div className="form-card">
      <div className="form-card-title">Meu Negócio</div>
      <p className="form-card-sub">Dados da empresa. Aparecem em documentos e PDFs.</p>
      <EmpresaForm
        nome={empresa?.nome ?? ""}
        tipoPessoa={empresa?.tipoPessoa ?? "PJ"}
        documento={empresa?.documento ?? null}
        razaoSocial={empresa?.razaoSocial ?? null}
        email={empresa?.email ?? null}
        celular={empresa?.celular ?? null}
        isWhatsapp={empresa?.isWhatsapp ?? null}
        tipoEmpresa={empresa?.tipoEmpresa ?? null}
        descricao={empresa?.descricao ?? null}
        logoUrl={empresa?.logo ?? null}
      />
    </div>
  )
}
