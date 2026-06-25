import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { listGruposByEmpresa } from "@/data/grupoItem"
import { listCategoriasByEmpresa } from "@/data/categoriaItem"
import { listUnidadesByEmpresa } from "@/data/unidadeMedida"
import { TabelaPreCadastro } from "@/components/pre-cadastros/TabelaPreCadastro"
import {
  criarGrupoItem,
  editarGrupoItem,
  toggleAtivoGrupoItem,
  excluirGrupoItem,
} from "@/actions/grupoItem"
import {
  criarCategoriaItem,
  editarCategoriaItem,
  toggleAtivoCategoriaItem,
  excluirCategoriaItem,
} from "@/actions/categoriaItem"
import {
  criarUnidadeMedida,
  editarUnidadeMedida,
  toggleAtivoUnidadeMedida,
  excluirUnidadeMedida,
} from "@/actions/unidadeMedida"

export const metadata: Metadata = { title: "Catálogo — Pré-cadastros" }

const ABAS = [
  { key: "grupos", label: "Grupos de Item" },
  { key: "categorias", label: "Categorias de Item" },
  { key: "unidades", label: "Unidades de Medida" },
] as const

type Aba = (typeof ABAS)[number]["key"]

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const session = await auth()
  const empresaId = getEmpresaId(session!)
  const { aba: abaParam } = await searchParams
  const aba: Aba = (abaParam as Aba) ?? "grupos"

  const [grupos, categorias, unidades] = await Promise.all([
    aba === "grupos" ? listGruposByEmpresa(empresaId) : Promise.resolve([]),
    aba === "categorias" ? listCategoriasByEmpresa(empresaId) : Promise.resolve([]),
    aba === "unidades" ? listUnidadesByEmpresa(empresaId) : Promise.resolve([]),
  ])

  const actionsGrupos = {
    criar: criarGrupoItem,
    editar: editarGrupoItem,
    toggleAtivo: toggleAtivoGrupoItem,
    excluir: excluirGrupoItem,
  }

  const actionsCategorias = {
    criar: criarCategoriaItem,
    editar: editarCategoriaItem,
    toggleAtivo: toggleAtivoCategoriaItem,
    excluir: excluirCategoriaItem,
  }

  const actionsUnidades = {
    criar: criarUnidadeMedida,
    editar: editarUnidadeMedida,
    toggleAtivo: toggleAtivoUnidadeMedida,
    excluir: excluirUnidadeMedida,
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Catálogo — Pré-cadastros</h1>
            <p className="page-subtitle">
              Grupos, categorias e unidades de medida para o catálogo de itens.
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
            href={`/dashboard/catalogo?aba=${tab.key}`}
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

      {aba === "grupos" && (
        <TabelaPreCadastro
          items={grupos}
          actions={actionsGrupos}
          placeholder="Nome do grupo..."
        />
      )}
      {aba === "categorias" && (
        <TabelaPreCadastro
          items={categorias}
          actions={actionsCategorias}
          placeholder="Nome da categoria..."
        />
      )}
      {aba === "unidades" && (
        <TabelaPreCadastro
          items={unidades}
          actions={actionsUnidades}
          placeholder="Ex: m², kg, un..."
        />
      )}
    </div>
  )
}
