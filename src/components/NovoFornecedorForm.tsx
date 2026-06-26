"use client";

import { useState } from "react";
import Link from "next/link";
import { criarFornecedor } from "@/actions/fornecedor";
import { preencherFornecedorComAgente } from "@/actions/ai/preencherFornecedorComAgente";
import { PlusIcon } from "@/components/Icons";
import CapturaOperacionalPanel from "@/components/CapturaOperacionalPanel";
import CnpjInput, { type CnpjData } from "@/components/CnpjInput";

const TIPOS_VALIDOS = ["servico", "material", "ambos"];

interface Props {
  agenteFilled?: string;
  erro?: string;
  // agent-filled fields
  nome?: string;
  razaoSocial?: string;
  tipoPessoa?: string;
  cpfCnpj?: string;
  tipo?: string;
  telefone?: string;
  email?: string;
  site?: string;
  nomeResponsavel?: string;
  nomeContato?: string;
  categorias?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pendencias?: string;
}

export default function NovoFornecedorForm(props: Props) {
  const tipoPessoaInicial = props.tipoPessoa === "PJ" ? "PJ" : props.tipoPessoa === "PF" ? "PF" : "";
  const tipoInicial = props.tipo && TIPOS_VALIDOS.includes(props.tipo) ? props.tipo : "servico";

  const [tipoPessoa, setTipoPessoa] = useState(tipoPessoaInicial);
  const [nome, setNome] = useState(props.nome ?? "");
  const [razaoSocial, setRazaoSocial] = useState(props.razaoSocial ?? "");
  const [telefone, setTelefone] = useState(props.telefone ?? "");
  const [email, setEmail] = useState(props.email ?? "");
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
      setCepVal(data.cep.replace(/\D/g, ""));
      setRua(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.municipio || "");
      setEstado(data.uf || "");
    }
  }

  return (
    <>
      <CapturaOperacionalPanel
        action={preencherFornecedorComAgente}
        description="Cole um cartão de visita, nota fiscal, catálogo, e-mail ou conversa com dados do fornecedor. O agente preenche os campos — você revisa antes de salvar."
        agenteFilled={props.agenteFilled}
        erro={props.erro}
        pendencias={props.pendencias}
      />

      <div className="form-card">
        <div className="form-card-title">Novo fornecedor / prestador</div>
        <p className="form-card-sub">
          Cadastre prestadores de serviço ou fornecedores de material para organizar suas obras.
        </p>

        <form action={criarFornecedor}>

          <div className="form-card-section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", marginBottom: 12 }}>
            Identificação
          </div>

          <div className="form-group">
            <label className="form-label">Nome / Nome fantasia *</label>
            <input
              name="nome"
              type="text"
              className="form-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Elétrica Souza, Madeireira Central"
              required
              minLength={2}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Razão Social</label>
            <input
              name="razaoSocial"
              type="text"
              className="form-input"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              placeholder="Nome empresarial (somente PJ)"
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
                <option value="">Não informado</option>
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">CPF / CNPJ</label>
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
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  maxLength={20}
                />
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Tipo de fornecedor</label>
            <select name="tipo" className="form-input form-select" defaultValue={tipoInicial}>
              <option value="servico">Prestador de Serviço</option>
              <option value="material">Fornecedor de Material</option>
              <option value="ambos">Serviço + Material</option>
            </select>
          </div>

          <div className="form-card-section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", marginTop: 24, marginBottom: 12 }}>
            Contato
          </div>

          <div className="form-row">
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
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Site</label>
            <input
              name="site"
              type="url"
              className="form-input"
              defaultValue={props.site ?? ""}
              placeholder="https://"
              maxLength={300}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome do responsável</label>
              <input name="nomeResponsavel" type="text" className="form-input" defaultValue={props.nomeResponsavel ?? ""} placeholder="Responsável pela empresa" maxLength={200} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome do contato / comprador</label>
              <input name="nomeContato" type="text" className="form-input" defaultValue={props.nomeContato ?? ""} placeholder="Quem atende pedidos" maxLength={200} />
            </div>
          </div>

          <div className="form-card-section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", marginTop: 24, marginBottom: 12 }}>
            Categorias
          </div>

          <div className="form-group">
            <label className="form-label">Categorias de atuação</label>
            <input
              name="categorias"
              type="text"
              className="form-input"
              defaultValue={props.categorias ?? ""}
              placeholder="Ex: elétrica, hidráulica, pintura"
              maxLength={500}
            />
            <span className="form-hint">Separe com vírgula.</span>
          </div>

          <div className="form-card-section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", marginTop: 24, marginBottom: 12 }}>
            Endereço
          </div>

          <div className="form-group">
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

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <PlusIcon size={15} />
              Salvar fornecedor
            </button>
            <Link href="/dashboard/fornecedores" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
