"use client"
import { useActionState, useEffect } from "react"
import { criarClienteInline } from "@/actions/clienteInline"
import EnderecoFields from "@/components/EnderecoFields"
import { ORIGENS_CONTATO } from "@/lib/origens"

type Props = {
  open: boolean
  onClose: () => void
  onClienteCriado: (clienteId: string, clienteNome: string) => void
}

const initial = { clienteId: null, clienteNome: null, error: null }

export function CadastroClienteDrawer({ open, onClose, onClienteCriado }: Props) {
  const [state, action, isPending] = useActionState(criarClienteInline, initial)

  useEffect(() => {
    if (state.clienteId && state.clienteNome) {
      onClienteCriado(state.clienteId, state.clienteNome)
    }
  }, [state.clienteId])

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

          {/* Nome */}
          <div className="form-group">
            <label className="form-label">Nome completo *</label>
            <input
              name="nome"
              type="text"
              className="form-input"
              placeholder="Ex: João da Silva"
              required
              minLength={2}
              maxLength={200}
              autoFocus
            />
          </div>

          {/* Tipo + Telefone */}
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tipo de pessoa</label>
              <select name="tipoPessoa" className="form-input form-select">
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Telefone / WhatsApp</label>
              <input
                name="telefone"
                type="tel"
                className="form-input"
                placeholder="(11) 99999-9999"
                maxLength={20}
              />
            </div>
          </div>

          {/* Origem */}
          <div className="form-group" style={{ marginTop: 18 }}>
            <label className="form-label">Origem do contato</label>
            <select name="origemContato" className="form-input form-select" defaultValue="">
              <option value="">Não informada</option>
              {ORIGENS_CONTATO.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* RG + Data nascimento */}
          <div className="form-row" style={{ marginTop: 18 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">RG</label>
              <input
                name="rg"
                type="text"
                className="form-input"
                placeholder="00.000.000-0"
                maxLength={20}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Data de Nascimento</label>
              <input name="dataNascimento" type="date" className="form-input" />
            </div>
          </div>

          {/* Razão Social */}
          <div className="form-group" style={{ marginTop: 24 }}>
            <label className="form-label">Razão Social</label>
            <input
              name="razaoSocial"
              type="text"
              className="form-input"
              placeholder="Nome empresarial (somente PJ)"
              maxLength={200}
            />
          </div>

          {/* Email + CPF/CNPJ */}
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">E-mail</label>
              <input
                name="email"
                type="email"
                className="form-input"
                placeholder="contato@exemplo.com"
                maxLength={200}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">CPF / CNPJ</label>
              <input
                name="cpfCnpj"
                type="text"
                className="form-input"
                placeholder="000.000.000-00"
                maxLength={20}
              />
            </div>
          </div>

          {/* Endereço com ViaCEP */}
          <EnderecoFields
            fieldNames={{
              cep: "cep",
              logradouro: "rua",
              numero: "numero",
              complemento: "complemento",
              bairro: "bairro",
              cidade: "cidade",
              estado: "estado",
            }}
          />

          {/* Observações */}
          <div className="form-group" style={{ marginTop: 24 }}>
            <label className="form-label">Observações</label>
            <textarea
              name="observacoes"
              className="form-input form-textarea"
              placeholder="Notas sobre o cliente..."
              maxLength={1000}
              rows={3}
            />
          </div>

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
