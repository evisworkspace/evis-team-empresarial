"use client"

import { useRef, useState } from "react"
import { salvarPerfil } from "@/actions/configuracoes"
import { CameraIcon } from "@/components/Icons"

type Props = {
  nome: string
  email: string
  cpf: string | null
  telefone: string | null
  fotoUrl: string | null
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

export function PerfilForm({ nome, email, cpf, telefone, fotoUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(fotoUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  return (
    <form action={salvarPerfil}>
      {/* Avatar */}
      <div
        className="avatar-wrap"
        onClick={() => inputRef.current?.click()}
        title="Clique para trocar a foto"
      >
        {preview ? (
          <img src={preview} alt="Foto de perfil" className="avatar-img" />
        ) : (
          <div className="avatar-initials">{getInitials(nome)}</div>
        )}
        <div className="avatar-overlay">
          <CameraIcon size={22} style={{ color: "#fff" }} />
        </div>
        <input
          ref={inputRef}
          type="file"
          name="foto"
          accept="image/*"
          style={{ display: "none" }}
          onChange={onFileChange}
        />
      </div>

      {/* Nome */}
      <div className="form-group">
        <label className="form-label">Nome completo *</label>
        <input
          name="nome"
          type="text"
          className="form-input"
          defaultValue={nome}
          required
          minLength={2}
          maxLength={200}
        />
      </div>

      {/* E-mail (somente leitura) */}
      <div className="form-group">
        <label className="form-label">E-mail de acesso</label>
        <input
          type="email"
          className="form-input"
          value={email}
          disabled
          style={{ opacity: 0.6, cursor: "not-allowed" }}
        />
      </div>

      {/* CPF + Telefone */}
      <div className="form-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">CPF</label>
          <input
            name="cpf"
            type="text"
            className="form-input"
            defaultValue={cpf ?? ""}
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Telefone</label>
          <input
            name="telefone"
            type="tel"
            className="form-input"
            defaultValue={telefone ?? ""}
            placeholder="(11) 99999-9999"
            maxLength={20}
          />
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: 28 }}>
        <button type="submit" className="btn btn-primary">
          Salvar alterações
        </button>
      </div>
    </form>
  )
}
