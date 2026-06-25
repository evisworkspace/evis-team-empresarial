import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listClientesByEmpresa, countClientesByEmpresa } from "@/data/cliente";
import { UsersIcon, PlusIcon, ArrowRightIcon, PhoneIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { q } = await searchParams;
  const busca = q?.trim() || undefined;

  const [clientes, total] = await Promise.all([
    listClientesByEmpresa(empresaId, { q: busca }),
    countClientesByEmpresa(empresaId),
  ]);

  return (
    <div>
      {/* Tab nav Contatos */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid var(--clr-border)" }}>
        {[
          { href: "/dashboard/clientes", label: "Clientes", active: true },
          { href: "/dashboard/fornecedores", label: "Fornecedores", active: false },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: tab.active ? 700 : 400,
              color: tab.active ? "var(--clr-primary)" : "var(--clr-text-muted)",
              textDecoration: "none",
              borderBottom: tab.active ? "2px solid var(--clr-primary)" : "2px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.12s",
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Clientes</h1>
            <p className="page-subtitle">
              {busca
                ? `${clientes.length} resultado${clientes.length !== 1 ? "s" : ""} para "${busca}"`
                : `${total} cliente${total !== 1 ? "s" : ""} cadastrado${total !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link href="/dashboard/clientes/novo" className="btn btn-primary">
            <PlusIcon size={16} />
            Novo cliente
          </Link>
        </div>
      </div>

      {/* Busca */}
      <form method="GET" action="/dashboard/clientes" style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        <input
          name="q"
          type="search"
          className="form-input"
          placeholder="Buscar por nome..."
          defaultValue={busca ?? ""}
          style={{ maxWidth: 280 }}
        />
        <button type="submit" className="btn btn-secondary btn-sm">Buscar</button>
        {busca && (
          <Link href="/dashboard/clientes" className="btn btn-secondary btn-sm">Limpar</Link>
        )}
      </form>

      {clientes.length === 0 ? (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">
              <UsersIcon size={24} />
            </div>
            <div className="empty-state-title">
              {busca ? `Nenhum cliente encontrado para "${busca}"` : "Nenhum cliente cadastrado"}
            </div>
            <p className="empty-state-sub">
              {busca
                ? "Tente um nome diferente ou limpe a busca."
                : "Cadastre seus clientes para vinculá-los às obras e oportunidades."}
            </p>
            {!busca && (
              <Link href="/dashboard/clientes/novo" className="btn btn-primary" style={{ marginTop: 8 }}>
                <PlusIcon size={15} />
                Cadastrar primeiro cliente
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="evis-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Telefone</th>
                  <th>Origem</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--clr-text)" }}>{c.nome}</div>
                    </td>
                    <td>
                      {c.tipoPessoa && (
                        <span className="tipo-tag">{c.tipoPessoa}</span>
                      )}
                    </td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {c.telefone ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <PhoneIcon size={12} />
                          {c.telefone}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {c.origemContato ?? "—"}
                    </td>
                    <td>
                      <span className={`badge badge-${c.status}`}>
                        {c.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/clientes/${c.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        Ver <ArrowRightIcon size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
