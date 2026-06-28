"use client";

import { useState } from "react";
import CnpjInput, { type CnpjData } from "@/components/CnpjInput";
import { ORIGENS_CONTATO } from "@/lib/origens";

export type ClienteFormDefaults = {
  nome?: string;
  tipoPessoa?: string;
  telefone?: string;
  email?: string;
  cpfCnpj?: string;
  origemContato?: string;
  razaoSocial?: string;
  rg?: string;
  dataNascimento?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
};

const ORIGENS_VALIDAS = ORIGENS_CONTATO.map((o) => o.value) as string[];

interface Props {
  defaults?: ClienteFormDefaults;
  autoFocusNome?: boolean;
}

export default function ClienteFormFields({ defaults = {}, autoFocusNome = false }: Props) {
  const tipoPessoaInicial = defaults.tipoPessoa === "PJ" ? "PJ" : "PF";
  const origemInicial = defaults.origemContato && ORIGENS_VALIDAS.includes(defaults.origemContato)
    ? defaults.origemContato
    : "";

  const [tipoPessoa, setTipoPessoa] = useState(tipoPessoaInicial);
  const [nome, setNome] = useState(defaults.nome ?? "");
  const [razaoSocial, setRazaoSocial] = useState(defaults.razaoSocial ?? "");
  const [email, setEmail] = useState(defaults.email ?? "");
  const [telefone, setTelefone] = useState(defaults.telefone ?? "");
  const [cepVal, setCepVal] = useState(defaults.cep ?? "");
  const [rua, setRua] = useState(defaults.rua ?? "");
  const [bairro, setBairro] = useState(defaults.bairro ?? "");
  const [cidade, setCidade] = useState(defaults.cidade ?? "");
  const [estado, setEstado] = useState(defaults.estado ?? "");
  const [numero, setNumero] = useState(defaults.numero ?? "");
  const [complemento, setComplemento] = useState(defaults.complemento ?? "");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState(false);

  async function buscarCep(value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    setCepError(false);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError(true);
      } else {
        setRua(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidade(data.localidade ?? "");
        setEstado(data.uf ?? "");
      }
    } catch {
      // Usuário pode preencher manualmente.
    } finally {
      setCepLoading(false);
    }
  }

  function onCnpjLoaded(data: CnpjData) {
    if (!nome) setNome(data.nome_fantasia || data.razao_social || "");
    if (!razaoSocial) setRazaoSocial(data.razao_social || "");
    if (!email) setEmail(data.email || "");
    if (!telefone) setTelefone(data.ddd_telefone_1 || "");
    if (!cepVal && data.cep) setCepVal(data.cep.replace(/\D/g, ""));
    if (!rua) setRua(data.logradouro || "");
    if (!numero) setNumero(data.numero || "");
    if (!complemento) setComplemento(data.complemento || "");
    if (!bairro) setBairro(data.bairro || "");
    if (!cidade) setCidade(data.municipio || "");
    if (!estado) setEstado(data.uf || "");
  }

  return (
    <>
      <div className="form-group">
        <label className="form-label">Nome completo *</label>
        <input
          name="nome"
          type="text"
          className="form-input"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: João da Silva ou Empresa Ltda"
          required
          minLength={2}
          maxLength={200}
          autoFocus={autoFocusNome}
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tipo de pessoa</label>
          <select
            name="tipoPessoa"
            className="form-input form-select"
            value={tipoPessoa}
            onChange={(e) => setTipoPessoa(e.target.value)}
          >
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
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 99999-9999"
            maxLength={30}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 18 }}>
        <label className="form-label">Origem do contato</label>
        <select name="origemContato" className="form-input form-select" defaultValue={origemInicial}>
          <option value="">Não informada</option>
          {ORIGENS_CONTATO.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {tipoPessoa === "PF" && (
        <div className="form-row" style={{ marginTop: 18 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">RG</label>
            <input
              name="rg"
              type="text"
              className="form-input"
              defaultValue={defaults.rg ?? ""}
              placeholder="00.000.000-0"
              maxLength={20}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Data de Nascimento</label>
            <input
              name="dataNascimento"
              type="date"
              className="form-input"
              defaultValue={defaults.dataNascimento ?? ""}
            />
          </div>
        </div>
      )}

      {tipoPessoa === "PJ" && (
        <div className="form-group" style={{ marginTop: 18 }}>
          <label className="form-label">Razão Social</label>
          <input
            name="razaoSocial"
            type="text"
            className="form-input"
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
            placeholder="Nome empresarial conforme CNPJ"
            maxLength={200}
          />
        </div>
      )}

      <div className="form-row" style={{ marginTop: 18 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">E-mail</label>
          <input
            name="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contato@exemplo.com"
            maxLength={200}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{tipoPessoa === "PJ" ? "CNPJ" : "CPF"}</label>
          {tipoPessoa === "PJ" ? (
            <CnpjInput
              name="cpfCnpj"
              defaultValue={defaults.cpfCnpj ?? ""}
              onLoaded={onCnpjLoaded}
            />
          ) : (
            <input
              name="cpfCnpj"
              type="text"
              className="form-input"
              defaultValue={defaults.cpfCnpj ?? ""}
              placeholder="000.000.000-00"
              maxLength={20}
            />
          )}
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 24 }}>
        <label className="form-label">
          CEP
          {cepLoading && <span style={{ fontSize: 11, color: "var(--clr-text-muted)", marginLeft: 6 }}>buscando...</span>}
          {cepError && <span style={{ fontSize: 11, color: "var(--clr-danger)", marginLeft: 6 }}>CEP não encontrado</span>}
        </label>
        <input
          name="cep"
          type="text"
          className="form-input"
          value={cepVal}
          onChange={(e) => setCepVal(e.target.value)}
          onBlur={(e) => buscarCep(e.target.value)}
          placeholder="00000-000"
          maxLength={10}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Rua / Logradouro</label>
        <input
          name="rua"
          type="text"
          className="form-input"
          value={rua}
          onChange={(e) => setRua(e.target.value)}
          placeholder="Rua, Avenida..."
          maxLength={200}
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Número</label>
          <input
            name="numero"
            type="text"
            className="form-input"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Ex: 123"
            maxLength={20}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Complemento</label>
          <input
            name="complemento"
            type="text"
            className="form-input"
            value={complemento}
            onChange={(e) => setComplemento(e.target.value)}
            placeholder="Apto, Sala..."
            maxLength={100}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Bairro</label>
        <input
          name="bairro"
          type="text"
          className="form-input"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          placeholder="Bairro"
          maxLength={100}
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Cidade</label>
          <input
            name="cidade"
            type="text"
            className="form-input"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade"
            maxLength={100}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Estado</label>
          <input
            name="estado"
            type="text"
            className="form-input"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            placeholder="PR"
            maxLength={2}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 24 }}>
        <label className="form-label">Observações</label>
        <textarea
          name="observacoes"
          className="form-input form-textarea"
          defaultValue={defaults.observacoes ?? ""}
          placeholder="Notas sobre o cliente..."
          maxLength={1000}
          rows={3}
        />
      </div>
    </>
  );
}
