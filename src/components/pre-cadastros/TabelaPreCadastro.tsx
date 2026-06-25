"use client"
import { useState } from "react"

type Item = { id: string; nome: string; ativo: boolean; createdAt: Date }

type Actions = {
  criar: (fd: FormData) => Promise<void>
  editar: (fd: FormData) => Promise<void>
  toggleAtivo: (fd: FormData) => Promise<void>
  excluir: (fd: FormData) => Promise<void>
}

type Props = { items: Item[]; actions: Actions; placeholder: string }

export function TabelaPreCadastro({ items, actions, placeholder }: Props) {
  const [editandoId, setEditandoId] = useState<string | null>(null)

  return (
    <div>
      <form
        action={actions.criar}
        style={{ display: "flex", gap: 8, marginBottom: 24 }}
      >
        <input
          name="nome"
          className="form-input"
          placeholder={placeholder}
          style={{ maxWidth: 320 }}
          required
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Adicionar
        </button>
      </form>

      {items.length === 0 ? (
        <div className="card card-pad">
          <p style={{ color: "var(--clr-text-muted)", fontSize: 14, textAlign: "center" }}>
            Nenhum item cadastrado.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="evis-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {editandoId === item.id ? (
                        <form
                          action={actions.editar}
                          style={{ display: "flex", gap: 6, alignItems: "center" }}
                          onSubmit={() => setEditandoId(null)}
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            name="nome"
                            className="form-input"
                            defaultValue={item.nome}
                            style={{ maxWidth: 240 }}
                            required
                          />
                          <button type="submit" className="btn btn-primary btn-sm">
                            Salvar
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditandoId(null)}
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : (
                        <span style={{ fontWeight: 500, color: "var(--clr-text)" }}>
                          {item.nome}
                        </span>
                      )}
                    </td>
                    <td>
                      {item.ativo ? (
                        <span className="badge badge-ativo">Ativo</span>
                      ) : (
                        <span className="badge badge-inativo">Inativo</span>
                      )}
                    </td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() =>
                            setEditandoId(editandoId === item.id ? null : item.id)
                          }
                        >
                          Editar
                        </button>
                        <form action={actions.toggleAtivo}>
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
                          action={actions.excluir}
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
