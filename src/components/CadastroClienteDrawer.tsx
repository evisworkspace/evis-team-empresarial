"use client"
import { useActionState, useEffect } from "react"
import { criarClienteInline } from "@/actions/clienteInline"
import ClienteFormFields, { type ClienteFormDefaults } from "@/components/ClienteFormFields"

type Props = {
  open: boolean
  onClose: () => void
  onClienteCriado: (clienteId: string, clienteNome: string) => void
  defaults?: ClienteFormDefaults
}

const initial = { clienteId: null, clienteNome: null, error: null }

export function CadastroClienteDrawer({ open, onClose, onClienteCriado, defaults }: Props) {
  const [state, action, isPending] = useActionState(criarClienteInline, initial)

  useEffect(() => {
    if (state.clienteId && state.clienteNome) {
      onClienteCriado(state.clienteId, state.clienteNome)
    }
  }, [state.clienteId, state.clienteNome, onClienteCriado])

  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 200,
          cursor: "pointer",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(500px, 100vw)",
          background: "var(--clr-bg)",
          zIndex: 201,
          overflowY: "auto",
          boxShadow: "-6px 0 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 18px",
            borderBottom: "1px solid var(--clr-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: "var(--clr-bg)",
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--clr-text)" }}>
              Cadastrar cliente
            </div>
            <div style={{ fontSize: 13, color: "var(--clr-text-muted)", marginTop: 2 }}>
              Informe os dados do cliente para vinculá-lo à oportunidade.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              color: "var(--clr-text-muted)",
              padding: "4px 8px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form action={action} style={{ padding: "20px 24px 32px", flex: 1 }}>
          {state.error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                borderRadius: "var(--r-md)",
                padding: "10px 12px",
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              {state.error}
            </div>
          )}

          <ClienteFormFields defaults={defaults} autoFocusNome />

          {/* Ações */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid var(--clr-border)",
              position: "sticky",
              bottom: 0,
              background: "var(--clr-bg)",
              paddingBottom: 4,
            }}
          >
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? "Salvando..." : "Confirmar"}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
