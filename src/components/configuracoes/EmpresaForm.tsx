"use client"

import { useRef, useState } from "react"
import { salvarEmpresa } from "@/actions/configuracoes"
import { BuildingIcon } from "@/components/Icons"
import CnpjInput, { type CnpjData } from "@/components/CnpjInput"

type Props = {
  nome: string
  tipoPessoa: string
  documento: string | null
  razaoSocial: string | null
  email: string | null
  celular: string | null
  isWhatsapp: boolean | null
  tipoEmpresa: string | null
  descricao: string | null
  logoUrl: string | null
}

const tiposEmpresa = [
  "Construtora",
  "Incorporadora",
  "Arquitetura",
  "Engenharia",
  "Reforma e Manutenção",
  "Outro",
]

export function EmpresaForm({
  nome, tipoPessoa, documento, razaoSocial, email,
  celular, isWhatsapp, tipoEmpresa, descricao, logoUrl,
}: Props) {
  const [tipo, setTipo] = useState(tipoPessoa || "PJ")
  const [tipoEmp, setTipoEmp] = useState(tipoEmpresa ?? "")
  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrl)
  const logoRef = useRef<HTMLInputElement>(null)
  const [nomeVal, setNomeVal] = useState(nome)
  const [razaoSocialVal, setRazaoSocialVal] = useState(razaoSocial ?? "")
  const [emailVal, setEmailVal] = useState(email ?? "")
  const [celularVal, setCelularVal] = useState(celular ?? "")

  function onCnpjLoaded(data: CnpjData) {
    if (!nomeVal) setNomeVal(data.nome_fantasia || data.razao_social || "")
    if (!razaoSocialVal) setRazaoSocialVal(data.razao_social || "")
    if (!emailVal) setEmailVal(data.email || "")
    if (!celularVal) setCelularVal(data.ddd_telefone_1 || "")
  }

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setLogoPreview(URL.createObjectURL(file))
  }

  return (
    <form action={salvarEmpresa}>
      {/* Logo */}
      <div className="form-group">
        <label className="form-label">Logomarca</label>
        <div className="logo-wrap">
          <div
            className="logo-preview"
            onClick={() => logoRef.current?.click()}
            title="Clique para enviar a logo"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" />
            ) : (
              <BuildingIcon size={24} style={{ color: "var(--clr-text-muted)" }} />
            )}
          </div>
          <div className="logo-hint">
            Formatos: PNG, JPG, SVG<br />
            A logo aparece em documentos e PDFs.<br />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 6 }}
              onClick={() => logoRef.current?.click()}
            >
              Escolher arquivo
            </button>
          </div>
          <input
            ref={logoRef}
            type="file"
            name="logo"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onLogoChange}
          />
        </div>
      </div>

      {/* Tipo de pessoa */}
      <div className="form-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tipo *</label>
          <select
            name="tipoPessoa"
            className="form-input form-select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="PJ">Pessoa Jurídica</option>
            <option value="PF">Pessoa Física</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tipo de empresa</label>
          <select
            name="tipoEmpresa"
            className="form-input form-select"
            value={tipoEmp}
            onChange={(e) => setTipoEmp(e.target.value)}
          >
            <option value="">Selecione...</option>
            {tiposEmpresa.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Nome */}
      <div className="form-group" style={{ marginTop: 18 }}>
        <label className="form-label">Nome do negócio *</label>
        <input
          name="nome"
          type="text"
          className="form-input"
          value={nomeVal}
          onChange={(e) => setNomeVal(e.target.value)}
          required
          minLength={2}
          maxLength={200}
        />
      </div>

      {/* Razão Social (PJ) */}
      {tipo === "PJ" && (
        <div className="form-group">
          <label className="form-label">Razão Social</label>
          <input
            name="razaoSocial"
            type="text"
            className="form-input"
            value={razaoSocialVal}
            onChange={(e) => setRazaoSocialVal(e.target.value)}
            placeholder="Nome empresarial conforme CNPJ"
            maxLength={200}
          />
        </div>
      )}

      {/* CPF / CNPJ */}
      <div className="form-group">
        <label className="form-label">{tipo === "PJ" ? "CNPJ" : "CPF"}</label>
        {tipo === "PJ" ? (
          <CnpjInput
            name="documento"
            defaultValue={documento ?? ""}
            onLoaded={onCnpjLoaded}
          />
        ) : (
          <input
            name="documento"
            type="text"
            className="form-input"
            defaultValue={documento ?? ""}
            placeholder="000.000.000-00"
            maxLength={20}
          />
        )}
      </div>

      {/* Email + Celular */}
      <div className="form-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">E-mail comercial</label>
          <input
            name="email"
            type="email"
            className="form-input"
            value={emailVal}
            onChange={(e) => setEmailVal(e.target.value)}
            placeholder="contato@empresa.com"
            maxLength={200}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Celular</label>
          <input
            name="celular"
            type="tel"
            className="form-input"
            value={celularVal}
            onChange={(e) => setCelularVal(e.target.value)}
            placeholder="(11) 99999-9999"
            maxLength={20}
          />
        </div>
      </div>

      {/* WhatsApp checkbox */}
      <div className="form-group" style={{ marginTop: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5 }}>
          <input
            type="checkbox"
            name="isWhatsapp"
            defaultChecked={isWhatsapp ?? false}
          />
          Este número também é WhatsApp
        </label>
      </div>

      {/* Descrição */}
      <div className="form-group" style={{ marginTop: 8 }}>
        <label className="form-label">Descrição do negócio</label>
        <textarea
          name="descricao"
          className="form-input form-textarea"
          defaultValue={descricao ?? ""}
          placeholder="Conte um pouco sobre a empresa..."
          rows={3}
          maxLength={1000}
        />
      </div>

      <div className="form-actions" style={{ marginTop: 28 }}>
        <button type="submit" className="btn btn-primary">
          Salvar alterações
        </button>
      </div>
    </form>
  )
}
