import type { Metadata } from "next";
import Link from "next/link";
import { criarCliente } from "@/actions/cliente";
import { PlusIcon } from "@/components/Icons";
import EnderecoFields from "@/components/EnderecoFields";

export const metadata: Metadata = { title: "Novo Cliente" };

export default async function NovoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div>
      <Link href="/dashboard/clientes" className="back-link">
        ← Clientes
      </Link>

      <div className="form-card">
        <div className="form-card-title">Novo cliente</div>
        <p className="form-card-sub">
          Informe os dados do cliente para vinculá-lo às obras e oportunidades.
        </p>

        <form action={criarCliente}>
          {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

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
            <input
              name="origemContato"
              type="text"
              className="form-input"
              placeholder="Ex: Indicação, Instagram, WhatsApp, Google"
              maxLength={100}
            />
          </div>

          {/* Dados de identificação */}
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
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                maxLength={20}
              />
            </div>
          </div>

          {/* Endereço */}
          <EnderecoFields
            fieldNames={{ cep: "cep", logradouro: "rua", numero: "numero", complemento: "complemento", bairro: "bairro", cidade: "cidade", estado: "estado" }}
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
    </div>
  );
}
