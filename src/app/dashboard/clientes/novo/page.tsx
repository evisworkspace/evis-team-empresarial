import type { Metadata } from "next";
import Link from "next/link";
import { criarCliente } from "@/actions/cliente";
import { PlusIcon } from "@/components/Icons";

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
