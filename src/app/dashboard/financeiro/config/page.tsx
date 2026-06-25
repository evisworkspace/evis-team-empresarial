import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { listCategoriasFinanceirasByEmpresa } from "@/data/categoriaFinanceira"
import { listCentrosByEmpresa } from "@/data/centroDeCusto"
import { TabelaPreCadastro } from "@/components/pre-cadastros/TabelaPreCadastro"
import {
  criarCategoriaFinanceira,
  editarCategoriaFinanceira,
  toggleAtivoCategoriaFinanceira,
  excluirCategoriaFinanceira,
} from "@/actions/categoriaFinanceira"
import {
  criarCentroDeCusto,
  editarCentroDeCusto,
  toggleAtivoCentroDeCusto,
  excluirCentroDeCusto,
} from "@/actions/centroDeCusto"

export const metadata: Metadata = { title: "Config. Financeiro" }

const ABAS = [
  { key: "categorias-financeiras", label: "Categorias Financeiras" },
  { key: "centros", label: "Centros de Custo" },
] as const

type Aba = (typeof ABAS)[number]["key"]

export default async function FinanceiroConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const session = await auth()
  const empresaId = getEmpresaId(session!)
  const { aba: abaParam } = await searchParams
  const aba: Aba = (abaParam as Aba) ?? "categorias-financeiras"

  const [categorias, centros] = await Promise.all([
    aba === "categorias-financeiras"
      ? listCategoriasFinanceirasByEmpresa(empresaId)
      : Promise.resolve([]),
    aba === "centros" ? listCentrosByEmpresa(empresaId) : Promise.resolve([]),
  ])

  const actionsCentros = {
    criar: criarCentroDeCusto,
    editar: editarCentroDeCusto,
    toggleAtivo: toggleAtivoCentroDeCusto,
    excluir: excluirCentroDeCusto,
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Config. Financeiro</h1>
            <p className="page-subtitle">
              Categorias financeiras e centros de custo da empresa.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 24,
          borderBottom: "2px solid var(--clr-border)",
        }}
      >
        {ABAS.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/financeiro/config?aba=${tab.key}`}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: aba === tab.key ? 700 : 400,
              color: aba === tab.key ? "var(--clr-primary)" : "var(--clr-text-muted)",
              textDecoration: "none",
              borderBottom:
                aba === tab.key
                  ? "2px solid var(--clr-primary)"
                  : "2px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.12s",
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {aba === "categorias-financeiras" && (
        <div>
          <form
            action={criarCategoriaFinanceira}
            style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>Nº</label>
              <input
                name="numero"
                className="form-input"
                placeholder="1.1"
                style={{ width: 80 }}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>Nome</label>
              <input
                name="nome"
                className="form-input"
                placeholder="Nome da categoria..."
                style={{ minWidth: 200 }}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>Tipo</label>
              <select name="tipo" className="form-input" required>
                <option value="">Selecione</option>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>Grupo DRE (opcional)</label>
              <input
                name="grupoDRE"
                className="form-input"
                placeholder="Ex: Receita Bruta"
                style={{ minWidth: 160 }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: "flex-end" }}>
              Adicionar
            </button>
          </form>

          {categorias.length === 0 ? (
            <div className="card card-pad">
              <p style={{ color: "var(--clr-text-muted)", fontSize: 14, textAlign: "center" }}>
                Nenhuma categoria financeira cadastrada.
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table className="evis-table">
                  <thead>
                    <tr>
                      <th>Nº</th>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Pai</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((cat) => (
                      <tr key={cat.id}>
                        <td style={{ fontWeight: 600, color: "var(--clr-text-secondary)", fontSize: 13 }}>
                          {cat.numero}
                        </td>
                        <td style={{ fontWeight: 500, color: "var(--clr-text)" }}>{cat.nome}</td>
                        <td>
                          <span
                            className={`badge ${cat.tipo === "receita" ? "badge-ativo" : "badge-inativo"}`}
                          >
                            {cat.tipo === "receita" ? "Receita" : "Despesa"}
                          </span>
                        </td>
                        <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                          {cat.parent ? `${cat.parent.numero} ${cat.parent.nome}` : "—"}
                        </td>
                        <td>
                          {cat.ativo ? (
                            <span className="badge badge-ativo">Ativo</span>
                          ) : (
                            <span className="badge badge-inativo">Inativo</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <form action={toggleAtivoCategoriaFinanceira}>
                              <input type="hidden" name="id" value={cat.id} />
                              <input type="hidden" name="ativo" value={cat.ativo ? "true" : "false"} />
                              <button type="submit" className="btn btn-sm btn-secondary">
                                {cat.ativo ? "Desativar" : "Ativar"}
                              </button>
                            </form>
                            <form
                              action={excluirCategoriaFinanceira}
                              onSubmit={(e) => {
                                if (!confirm(`Excluir "${cat.nome}"?`)) e.preventDefault()
                              }}
                            >
                              <input type="hidden" name="id" value={cat.id} />
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
      )}

      {aba === "centros" && (
        <TabelaPreCadastro
          items={centros}
          actions={actionsCentros}
          placeholder="Nome do centro de custo..."
        />
      )}
    </div>
  )
}
