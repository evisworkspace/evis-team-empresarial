import type { Metadata } from "next";
import Link from "next/link";
import { criarFornecedor } from "@/actions/fornecedor";
import { PlusIcon } from "@/components/Icons";

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
          {/* Nome */}
          <div className="form-group">
            <label className="form-label">Nome *</label>
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

          {/* Tipo */}
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select name="tipo" className="form-input form-select">
              <option value="servico">Prestador de Serviço</option>
              <option value="material">Fornecedor de Material</option>
              <option value="ambos">Serviço + Material</option>
            </select>
          </div>

          {/* Contato */}
          <div className="form-group">
            <label className="form-label">Contato (telefone / WhatsApp)</label>
            <input
              name="contato"
              type="text"
              className="form-input"
              placeholder="(11) 99999-9999"
              maxLength={100}
            />
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
    </div>
  );
}
