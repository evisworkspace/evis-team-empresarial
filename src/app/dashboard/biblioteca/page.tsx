import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { listItensByEmpresa } from "@/data/itemBiblioteca"
import {
  excluirItemBiblioteca,
  toggleAtivoItemBiblioteca,
} from "@/actions/itemBiblioteca"

export const metadata: Metadata = { title: "Minha Biblioteca" }

const TIPOS = [
  { value: "",           label: "Todos"       },
  { value: "material",   label: "Material"    },
  { value: "servico",    label: "Serviço"     },
  { value: "composicao", label: "Composição"  },
]

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

function tipoBadge(tipo: string) {
  if (tipo === "material")
    return <span className="badge badge-ativo">Material</span>
  if (tipo === "servico")
    return (
      <span className="badge" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
        Serviço
      </span>
    )
  return (
    <span className="badge" style={{ background: "#fef9c3", color: "#854d0e" }}>
      Composição
    </span>
  )
}

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; q?: string }>
}) {
  const session = await auth()
  const empresaId = getEmpresaId(session!)
  const { tipo, q } = await searchParams

  const itens = await listItensByEmpresa(empresaId, {
    tipo: tipo || undefined,
    q: q || undefined,
  })

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Minha Biblioteca</h1>
            <p className="page-subtitle">
              Materiais, serviços e composições da empresa.
            </p>
          </div>
          <Link href="/dashboard/biblioteca/novo" className="btn btn-primary btn-sm">
            + Novo item
          </Link>
        </div>
      </div>

      {/* Pills de filtro */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {TIPOS.map((t) => (
          <Link
            key={t.value}
            href={t.value ? `?tipo=${t.value}` : "/dashboard/biblioteca"}
            className="btn btn-sm btn-secondary"
            style={
              (tipo ?? "") === t.value
                ? { background: "var(--clr-primary)", color: "#fff" }
                : {}
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Busca */}
      <form method="GET" style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          name="q"
          defaultValue={q ?? ""}
          className="form-input"
          placeholder="Buscar por nome ou código..."
          style={{ maxWidth: 300 }}
        />
        <input type="hidden" name="tipo" value={tipo ?? ""} />
        <button type="submit" className="btn btn-sm btn-secondary">
          Buscar
        </button>
      </form>

      {itens.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--clr-text-muted)", fontSize: 14, marginBottom: 16 }}>
            Nenhum item cadastrado.
          </p>
          <Link href="/dashboard/biblioteca/novo" className="btn btn-primary btn-sm">
            + Adicionar primeiro item
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="evis-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Unidade</th>
                  <th>Grupo</th>
                  <th>Preço Unit.</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id}>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {item.codigo ?? "—"}
                    </td>
                    <td style={{ fontWeight: 500 }}>{item.nome}</td>
                    <td>{tipoBadge(item.tipo)}</td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {item.unidade?.nome ?? "—"}
                    </td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {item.grupo?.nome ?? "—"}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {item.precoUnitario != null
                        ? BRL.format(Number(item.precoUnitario))
                        : "—"}
                    </td>
                    <td>
                      {item.ativo ? (
                        <span className="badge badge-ativo">Ativo</span>
                      ) : (
                        <span className="badge badge-inativo">Inativo</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Link
                          href={`/dashboard/biblioteca/${item.id}/editar`}
                          className="btn btn-sm btn-secondary"
                        >
                          Editar
                        </Link>
                        <form action={toggleAtivoItemBiblioteca}>
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="ativo"
                            value={item.ativo ? "true" : "false"}
                          />
                          <button type="submit" className="btn btn-sm btn-secondary">
                            {item.ativo ? "Desativar" : "Ativar"}
                          </button>
                        </form>
                        <form
                          action={excluirItemBiblioteca}
                          onSubmit={(e) => {
                            if (!confirm(`Excluir "${item.nome}"?`)) e.preventDefault()
                          }}
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            className="btn btn-sm btn-secondary"
                            style={{ color: "var(--clr-danger, #ef4444)" }}
                          >
                            Excluir
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
