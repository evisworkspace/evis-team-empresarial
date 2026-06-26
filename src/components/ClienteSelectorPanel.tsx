"use client"
import { useState } from "react"
import { CadastroClienteDrawer } from "@/components/CadastroClienteDrawer"

type ClienteBasico = {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  cidade: string | null
  estado: string | null
}

type Props = {
  clientes: ClienteBasico[]
  defaultClienteId?: string
  defaultMode?: "existente" | "novo"
  defaultNovoClienteNome?: string
  defaultNovoClienteTelefone?: string
  defaultNovoClienteOrigem?: string
  semClientes: boolean
  origens: readonly { value: string; label: string }[]
  novoClienteHref?: string
}

export default function ClienteSelectorPanel({
  clientes,
  defaultClienteId,
  defaultMode,
  defaultNovoClienteNome,
  defaultNovoClienteTelefone,
  defaultNovoClienteOrigem,
  semClientes,
  origens,
}: Props) {
  const [localClientes, setLocalClientes] = useState<ClienteBasico[]>(clientes)
  const [selectedId, setSelectedId] = useState(defaultClienteId ?? "")
  const [activeTab, setActiveTab] = useState<"existente" | "novo">(
    defaultMode ?? (semClientes ? "novo" : "existente"),
  )
  const [drawerOpen, setDrawerOpen] = useState(false)

  const clienteSelecionado = localClientes.find((c) => c.id === selectedId)

  function handleClienteCriado(clienteId: string, clienteNome: string) {
    setLocalClientes((prev) => [
      ...prev,
      { id: clienteId, nome: clienteNome, telefone: null, email: null, cidade: null, estado: null },
    ])
    setSelectedId(clienteId)
    setActiveTab("existente")
    setDrawerOpen(false)
  }

  return (
    <>
      <CadastroClienteDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onClienteCriado={handleClienteCriado}
      />

      {/* Tabs */}
      <input type="hidden" name="clienteMode" value={activeTab} />

      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 16,
          borderBottom: "2px solid var(--clr-border)",
        }}
      >
        {(["existente", "novo"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? "var(--clr-primary)" : "var(--clr-text-muted)",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab ? "2px solid var(--clr-primary)" : "2px solid transparent",
              marginBottom: "-2px",
              cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            {tab === "existente" ? "Existente" : "Novo lead"}
          </button>
        ))}
      </div>

      {/* Seção: cliente existente */}
      {activeTab === "existente" && (
        <div>
          {localClientes.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--clr-text-muted)", padding: "12px 0" }}>
              Nenhum cliente cadastrado. Use a aba Novo lead ao lado.
            </p>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <label className="form-label">Selecionar cliente *</label>
                <select
                  name="clienteId"
                  className="form-input form-select"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">Escolha um cliente...</option>
                  {localClientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                      {c.telefone ? ` — ${c.telefone}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {clienteSelecionado && (
                <div
                  style={{
                    background: "var(--clr-bg-subtle)",
                    border: "1px solid var(--clr-border)",
                    borderRadius: "var(--r-md)",
                    padding: 12,
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, fontSize: 14, color: "var(--clr-text)", marginBottom: 4 }}
                  >
                    {clienteSelecionado.nome}
                  </div>
                  {clienteSelecionado.telefone && (
                    <div style={{ fontSize: 13, color: "var(--clr-text-muted)" }}>
                      {clienteSelecionado.telefone}
                    </div>
                  )}
                  {clienteSelecionado.email && (
                    <div style={{ fontSize: 13, color: "var(--clr-text-muted)" }}>
                      {clienteSelecionado.email}
                    </div>
                  )}
                  {(clienteSelecionado.cidade || clienteSelecionado.estado) && (
                    <div style={{ fontSize: 12, color: "var(--clr-text-muted)", marginTop: 2 }}>
                      {[clienteSelecionado.cidade, clienteSelecionado.estado]
                        .filter(Boolean)
                        .join(" — ")}
                    </div>
                  )}
                </div>
              )}

              <p style={{ fontSize: 12, color: "var(--clr-text-muted)", marginTop: 8 }}>
                Lead novo?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("novo")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--clr-primary)",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  Use a aba Novo lead.
                </button>
              </p>
            </>
          )}
        </div>
      )}

      {/* Seção: novo cliente */}
      {activeTab === "novo" && (
        <div>
          {/* Botão principal — abre drawer com form completo */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="btn btn-primary"
            style={{ width: "100%", marginBottom: 16, justifyContent: "center" }}
          >
            + Cadastrar novo cliente
          </button>

          <div
            style={{
              borderTop: "1px solid var(--clr-border)",
              paddingTop: 14,
              marginBottom: 12,
            }}
          >
            <p style={{ fontSize: 12, color: "var(--clr-text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
              Ou preencha só o essencial agora e complete depois:
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input
              name="novoClienteNome"
              type="text"
              className="form-input"
              placeholder="Nome do cliente ou empresa"
              defaultValue={defaultNovoClienteNome ?? ""}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp / Telefone</label>
            <input
              name="novoClienteTelefone"
              type="tel"
              className="form-input"
              placeholder="(00) 00000-0000"
              defaultValue={defaultNovoClienteTelefone ?? ""}
              maxLength={30}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Como chegou até você?</label>
            <select
              name="novoClienteOrigem"
              className="form-input form-select"
              defaultValue={defaultNovoClienteOrigem ?? "indicacao"}
            >
              <option value="">Não informado</option>
              {origens.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  )
}
