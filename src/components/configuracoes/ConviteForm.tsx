"use client"

import { useState } from "react"
import { convidarMembro } from "@/actions/configuracoes"
import { MailIcon } from "@/components/Icons"

export function ConviteForm() {
  const [aberto, setAberto] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(formData: FormData) {
    await convidarMembro(formData)
    setEnviado(true)
    setAberto(false)
    setTimeout(() => setEnviado(false), 5000)
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--clr-text)" }}>Minha Equipe</h2>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => { setAberto(!aberto); setEnviado(false) }}
        >
          <MailIcon size={14} />
          Convidar membro
        </button>
      </div>

      {enviado && (
        <div className="callout callout--info" style={{ marginBottom: 16 }}>
          Convite enviado com sucesso.
        </div>
      )}

      {aberto && (
        <form action={handleSubmit} className="convite-form">
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">E-mail do convidado</label>
              <input
                name="email"
                type="email"
                className="form-input"
                placeholder="email@exemplo.com"
                required
                autoFocus
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Permissão</label>
              <select name="perfil" className="form-input form-select">
                <option value="membro">Membro</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary btn-sm">
              Enviar convite
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAberto(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
