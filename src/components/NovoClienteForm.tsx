"use client";

import { useState } from "react";
import Link from "next/link";
import { criarCliente } from "@/actions/cliente";
import { preencherClienteComAgente } from "@/actions/ai/preencherClienteComAgente";
import { PlusIcon } from "@/components/Icons";
import CapturaOperacionalPanel from "@/components/CapturaOperacionalPanel";
import CnpjInput, { type CnpjData } from "@/components/CnpjInput";
import { ORIGENS_CONTATO } from "@/lib/origens";

const ORIGENS_VALIDAS = ORIGENS_CONTATO.map((o) => o.value) as string[];

interface Props {
  redirectTo?: string;
  agenteFilled?: string;
  erro?: string;
  // agent-filled fields
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
  pendencias?: string;
}

export default function NovoClienteForm(props: Props) {
  const tipoPessoaInicial = props.tipoPessoa === "PJ" ? "PJ" : "PF";
  const origemInicial = props.origemContato && ORIGENS_VALIDAS.includes(props.origemContato)
    ? props.origemContato : "";

  const [tipoPessoa, setTipoPessoa] = useState(tipoPessoaInicial);
  const [nome, setNome] = useState(props.nome ?? "");
  const [razaoSocial, setRazaoSocial] = useState(props.razaoSocial ?? "");
  const [email, setEmail] = useState(props.email ?? "");
  const [telefone, setTelefone] = useState(props.telefone ?? "");
  // Address
  const [cepVal, setCepVal] = useState(props.cep ?? "");
  const [rua, setRua] = useState(props.rua ?? "");
  const [bairro, setBairro] = useState(props.bairro ?? "");
  const [cidade, setCidade] = useState(props.cidade ?? "");
  const [estado, setEstado] = useState(props.estado ?? "");
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
      if (data.erro) { setCepError(true); }
      else {
        setRua(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidade(data.localidade ?? "");
        setEstado(data.uf ?? "");
      }
    } catch { /* falha silenciosa */ }
    finally { setCepLoading(false); }
  }

  function onCnpjLoaded(data: CnpjData) {
    if (!nome) setNome(data.nome_fantasia || data.razao_social || "");
    if (!razaoSocial) setRazaoSocial(data.razao_social || "");
    if (!email) setEmail(data.email || "");
    if (!telefone) setTelefone(data.ddd_telefone_1 || "");
    if (!cepVal && data.cep) {
      const cepClean = data.cep.replace(/\D/g, "");
      setCepVal(cepClean);
      setRua(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.municipio || "");
      setEstado(data.uf || "");
    }
  }

  return (
    <>
      <CapturaOperacionalPanel
        action={preencherClienteComAgente}
        description="Cole um cartão de visita, conversa de WhatsApp, print ou texto com dados do cliente. O agente preenche os campos — você revisa antes de salvar."
        agenteFilled={props.agenteFilled}
        erro={props.erro}
        pendencias={props.pendencias}
      />

      <div className="form-card">
        <div className="form-card-title">Novo cliente</div>
        <p className="form-card-sub">
          Informe os dados do cliente para vinculá-lo às obras e oportunidades.
        </p>

        <form action={criarCliente}>
          {props.redirectTo && <input type="hidden" name="redirectTo" value={props.redirectTo} />}

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
                maxLength={20}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 18 }}>
            <label className="form-label">Origem do contato</label>
            <select
              name="origemContato"
              className="form-input form-select"
              defaultValue={origemInicial}
            >
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
                  defaultValue={props.rg ?? ""}
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
                  defaultValue={props.dataNascimento ?? ""}
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
                  defaultValue={props.cpfCnpj ?? ""}
                  onLoaded={onCnpjLoaded}
                />
              ) : (
                <input
                  name="cpfCnpj"
                  type="text"
                  className="form-input"
                  defaultValue={props.cpfCnpj ?? ""}
                  placeholder="000.000.000-00"
                  maxLength={20}
                />
              )}
            </div>
          </div>

          {/* Endereço */}
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
            <input name="rua" type="text" className="form-input" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua, Avenida..." maxLength={200} />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Número</label>
              <input name="numero" type="text" className="form-input" defaultValue={props.numero ?? ""} placeholder="Ex: 123" maxLength={20} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Complemento</label>
              <input name="complemento" type="text" className="form-input" defaultValue={props.complemento ?? ""} placeholder="Apto, Sala..." maxLength={100} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bairro</label>
            <input name="bairro" type="text" className="form-input" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" maxLength={100} />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cidade</label>
              <input name="cidade" type="text" className="form-input" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" maxLength={100} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estado</label>
              <input name="estado" type="text" className="form-input" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="PR" maxLength={2} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 24 }}>
            <label className="form-label">Observações</label>
            <textarea
              name="observacoes"
              className="form-input form-textarea"
              defaultValue={props.observacoes ?? ""}
              placeholder="Notas sobre o cliente..."
              maxLength={1000}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <PlusIcon size={15} />
              Salvar cliente
            </button>
            <Link href="/dashboard/clientes" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
