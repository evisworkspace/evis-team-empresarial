"use client"
import { useState } from "react"
import ClienteFormFields from "@/components/ClienteFormFields"
import type { ClienteFormDefaults } from "@/components/ClienteFormFields"

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
  defaultNovoCliente?: ClienteFormDefaults
  semClientes: boolean
}

export default function ClienteSelectorPanel({
  clientes,
  defaultClienteId,
  defaultMode,
  defaultNovoCliente,
  semClientes,
}: Props) {
  const localClientes = clientes
  const [selectedId, setSelectedId] = useState(defaultClienteId ?? "")
  const [activeTab, setActiveTab] = useState<"existente" | "novo">(
    defaultMode ?? (semClientes ? "novo" : "existente"),
  )

  const clienteSelecionado = localClientes.find((c) => c.id === selectedId)
  const temClienteDetectado = Boolean(defaultNovoCliente?.nome || defaultNovoCliente?.telefone || defaultNovoCliente?.cpfCnpj)

  return (
    <>
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
          <div
            style={{
              marginBottom: 12,
            }}
          >
            <p style={{ fontSize: 12, color: "var(--clr-text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
              O cliente será criado junto com esta oportunidade, usando o mesmo formulário completo de Cadastros.
            </p>
          </div>

          {temClienteDetectado && (
            <div
              style={{
                background: "var(--clr-bg-subtle)",
                border: "1px solid var(--clr-border)",
                borderRadius: "var(--r-md)",
                padding: 12,
                fontSize: 13,
                color: "var(--clr-text-muted)",
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: "var(--clr-text)" }}>{defaultNovoCliente?.nome}</strong>
              {defaultNovoCliente?.telefone ? <div>{defaultNovoCliente.telefone}</div> : null}
              {defaultNovoCliente?.cpfCnpj ? <div>{defaultNovoCliente.cpfCnpj}</div> : null}
              {(defaultNovoCliente?.cidade || defaultNovoCliente?.estado) ? (
                <div>{[defaultNovoCliente.cidade, defaultNovoCliente.estado].filter(Boolean).join(" — ")}</div>
              ) : null}
            </div>
          )}

          <ClienteFormFields defaults={defaultNovoCliente} />
        </div>
      )}
    </>
  )
}
