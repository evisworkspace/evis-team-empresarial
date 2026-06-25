import type { Metadata } from "next";
import Link from "next/link";
import { criarFornecedor } from "@/actions/fornecedor";
import { PlusIcon } from "@/components/Icons";
import EnderecoFields from "@/components/EnderecoFields";

export const metadata: Metadata = { title: "Novo Fornecedor" };

export default function NovoFornecedor() {
  return (
    <div>
      <Link href="/dashboard/fornecedores" className="back-link">
        ← Fornecedores
      </Link>

      <div className="form-card">
        <div className="form-card-title">Novo fornecedor / prestador</div>
        <p className="form-card-sub">
          Cadastre prestadores de serviço ou fornecedores de material para organizar suas obras.
        </p>

        <form action={criarFornecedor}>

          {/* Identificação */}
          <div className="form-card-section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", marginBottom: 12 }}>
            Identificação
          </div>

          <div className="form-group">
            <label className="form-label">Nome / Nome fantasia *</label>
            <input
              name="nome"
              type="text"
              className="form-input"
              placeholder="Ex: Elétrica Souza, Madeireira Central"
              required
              minLength={2}
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Razão Social</label>
            <input
              name="razaoSocial"
              type="text"
              className="form-input"
              placeholder="Nome empresarial (somente PJ)"
              maxLength={200}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tipo de pessoa</label>
              <select name="tipoPessoa" className="form-input form-select">
                <option value="">Não informado</option>
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">CPF / CNPJ</label>
              <input
                name="cpfCnpj"
                type="text"
                className="form-input"
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                maxLength={20}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Tipo de fornecedor</label>
            <select name="tipo" className="form-input form-select">
              <option value="servico">Prestador de Serviço</option>
              <option value="material">Fornecedor de Material</option>
              <option value="ambos">Serviço + Material</option>
            </select>
          </div>

          {/* Contato */}
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
              placeholder="https://"
              maxLength={300}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome do responsável</label>
              <input
                name="nomeResponsavel"
                type="text"
                className="form-input"
                placeholder="Responsável pela empresa"
                maxLength={200}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome do contato / comprador</label>
              <input
                name="nomeContato"
                type="text"
                className="form-input"
                placeholder="Quem atende pedidos"
                maxLength={200}
              />
            </div>
          </div>

          {/* Categorias */}
          <div className="form-card-section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", marginTop: 24, marginBottom: 12 }}>
            Categorias
          </div>

          <div className="form-group">
            <label className="form-label">Categorias de atuação</label>
            <input
              name="categorias"
              type="text"
              className="form-input"
              placeholder="Ex: elétrica, hidráulica, pintura"
              maxLength={500}
            />
            <span className="form-hint">Separe com vírgula.</span>
          </div>

          {/* Endereço */}
          <div className="form-card-section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", marginTop: 24, marginBottom: 12 }}>
            Endereço
          </div>

          <EnderecoFields
            fieldNames={{ cep: "cep", logradouro: "rua", numero: "numero", complemento: "complemento", bairro: "bairro", cidade: "cidade", estado: "estado" }}
            marginTop={0}
          />

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
    </div>
  );
}
