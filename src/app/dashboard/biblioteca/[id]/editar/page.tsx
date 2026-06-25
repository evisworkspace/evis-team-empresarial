import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { getItemBiblioteca } from "@/data/itemBiblioteca"
import { listGruposByEmpresa } from "@/data/grupoItem"
import { listCategoriasByEmpresa } from "@/data/categoriaItem"
import { listUnidadesByEmpresa } from "@/data/unidadeMedida"
import { listFornecedoresByEmpresa } from "@/data/fornecedor"
import { ItemBibliotecaForm } from "@/components/biblioteca/ItemBibliotecaForm"
import { editarItemBiblioteca } from "@/actions/itemBiblioteca"

export const metadata: Metadata = { title: "Editar item — Biblioteca" }

export default async function EditarBibliotecaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const empresaId = getEmpresaId(session!)
  const [item, grupos, categorias, unidades, fornecedores] = await Promise.all([
    getItemBiblioteca(empresaId, id),
    listGruposByEmpresa(empresaId),
    listCategoriasByEmpresa(empresaId),
    listUnidadesByEmpresa(empresaId),
    listFornecedoresByEmpresa(empresaId, { take: 200 }),
  ])
  if (!item) notFound()

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Editar item</h1>
      </div>
      <div className="card card-pad" style={{ maxWidth: 640 }}>
        <ItemBibliotecaForm
          action={editarItemBiblioteca}
          grupos={grupos}
          categorias={categorias}
          unidades={unidades}
          fornecedores={fornecedores}
          defaultValues={{
            id:            item.id,
            nome:          item.nome,
            tipo:          item.tipo,
            codigo:        item.codigo ?? undefined,
            descricao:     item.descricao ?? undefined,
            precoUnitario: item.precoUnitario ? Number(item.precoUnitario) : null,
            unidadeId:     item.unidadeId,
            grupoId:       item.grupoId,
            categoriaId:   item.categoriaId,
            fornecedorId:  item.fornecedorId,
          }}
        />
      </div>
    </div>
  )
}
