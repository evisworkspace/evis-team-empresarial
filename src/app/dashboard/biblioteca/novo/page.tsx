import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { listGruposByEmpresa } from "@/data/grupoItem"
import { listCategoriasByEmpresa } from "@/data/categoriaItem"
import { listUnidadesByEmpresa } from "@/data/unidadeMedida"
import { ItemBibliotecaForm } from "@/components/biblioteca/ItemBibliotecaForm"
import { criarItemBiblioteca } from "@/actions/itemBiblioteca"

export const metadata: Metadata = { title: "Novo item — Biblioteca" }

export default async function NovoBibliotecaPage() {
  const session = await auth()
  const empresaId = getEmpresaId(session!)
  const [grupos, categorias, unidades] = await Promise.all([
    listGruposByEmpresa(empresaId),
    listCategoriasByEmpresa(empresaId),
    listUnidadesByEmpresa(empresaId),
  ])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Novo item</h1>
      </div>
      <div className="card card-pad" style={{ maxWidth: 640 }}>
        <ItemBibliotecaForm
          action={criarItemBiblioteca}
          grupos={grupos}
          categorias={categorias}
          unidades={unidades}
        />
      </div>
    </div>
  )
}
