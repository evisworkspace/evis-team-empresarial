"use client"
import { useState } from "react"
import Link from "next/link"

type SelectOption = { id: string; nome: string }

type Props = {
  action: (fd: FormData) => Promise<void>
  unidades: SelectOption[]
  grupos: SelectOption[]
  categorias: SelectOption[]
  defaultValues?: {
    id?: string
    nome?: string
    tipo?: string
    codigo?: string
    descricao?: string
    precoUnitario?: number | null
    unidadeId?: string | null
    grupoId?: string | null
    categoriaId?: string | null
  }
}

export function ItemBibliotecaForm({
  action,
  unidades,
  grupos,
  categorias,
  defaultValues,
}: Props) {
  const [tipo, setTipo] = useState(defaultValues?.tipo ?? "")

  return (
    <form action={action}>
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <div className="form-group">
        <label className="form-label">Tipo *</label>
        <select
          name="tipo"
          className="form-input"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          required
        >
          <option value="">Selecione...</option>
          <option value="material">Material</option>
          <option value="servico">Serviço</option>
          <option value="composicao">Composição</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Código</label>
          <input
            name="codigo"
            className="form-input"
            placeholder="Ex: MAT-001"
            maxLength={50}
            defaultValue={defaultValues?.codigo ?? ""}
          />
        </div>
        <div className="form-group" style={{ flex: 3 }}>
          <label className="form-label">Nome *</label>
          <input
            name="nome"
            className="form-input"
            placeholder="Nome do item..."
            maxLength={200}
            defaultValue={defaultValues?.nome ?? ""}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Descrição</label>
        <textarea
          name="descricao"
          className="form-input"
          rows={3}
          placeholder="Descrição opcional..."
          defaultValue={defaultValues?.descricao ?? ""}
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Preço unitário</label>
          <input
            name="precoUnitario"
            type="number"
            className="form-input"
            step="0.0001"
            min="0"
            placeholder="0,00"
            defaultValue={
              defaultValues?.precoUnitario != null
                ? String(defaultValues.precoUnitario)
                : ""
            }
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Unidade</label>
          <select
            name="unidadeId"
            className="form-input"
            defaultValue={defaultValues?.unidadeId ?? ""}
          >
            <option value="">Selecione...</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Grupo</label>
          <select
            name="grupoId"
            className="form-input"
            defaultValue={defaultValues?.grupoId ?? ""}
          >
            <option value="">Selecione...</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Categoria</label>
          <select
            name="categoriaId"
            className="form-input"
            defaultValue={defaultValues?.categoriaId ?? ""}
          >
            <option value="">Selecione...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary">
          Salvar
        </button>
        <Link href="/dashboard/biblioteca" className="btn btn-secondary">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
