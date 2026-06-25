import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listFornecedoresByEmpresa, countFornecedoresByEmpresa } from "@/data/fornecedor";
import { TruckIcon, PlusIcon, ArrowRightIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Fornecedores" };

function tipoLabel(tipo: string) {
  const map: Record<string, string> = {
    servico: "Serviço",
    material: "Material",
    ambos: "Serviço + Material",
  };
  return map[tipo] ?? tipo;
}

export default async function FornecedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; q?: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { tipo: tipoFilter, q } = await searchParams;
  const busca = q?.trim() || undefined;

  const [fornecedores, total] = await Promise.all([
    listFornecedoresByEmpresa(empresaId, { tipo: tipoFilter, q: busca }),
    countFornecedoresByEmpresa(empresaId),
  ]);

  return (
    <div>
      {/* Tab nav Contatos */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid var(--clr-border)" }}>
        {[
          { href: "/dashboard/clientes", label: "Clientes", active: false },
          { href: "/dashboard/fornecedores", label: "Fornecedores", active: true },
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
            <h1 className="page-title">Fornecedores e Prestadores</h1>
            <p className="page-subtitle">
              {busca
                ? `${fornecedores.length} resultado${fornecedores.length !== 1 ? "s" : ""} para "${busca}"`
                : `${total} fornecedor${total !== 1 ? "es" : ""} cadastrado${total !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link href="/dashboard/fornecedores/novo" className="btn btn-primary">
            <PlusIcon size={16} />
            Novo fornecedor
          </Link>
        </div>
      </div>

      {/* Busca */}
      <form method="GET" action="/dashboard/fornecedores" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        {tipoFilter && <input type="hidden" name="tipo" value={tipoFilter} />}
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
          <Link href={tipoFilter ? `/dashboard/fornecedores?tipo=${tipoFilter}` : "/dashboard/fornecedores"} className="btn btn-secondary btn-sm">Limpar</Link>
        )}
      </form>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Link
          href="/dashboard/fornecedores"
          className={`btn btn-sm ${!tipoFilter ? "btn-primary" : "btn-secondary"}`}
        >
          Todos ({total})
        </Link>
        <Link
          href="/dashboard/fornecedores?tipo=servico"
          className={`btn btn-sm ${tipoFilter === "servico" ? "btn-primary" : "btn-secondary"}`}
        >
          Serviços
        </Link>
        <Link
          href="/dashboard/fornecedores?tipo=material"
          className={`btn btn-sm ${tipoFilter === "material" ? "btn-primary" : "btn-secondary"}`}
        >
          Materiais
        </Link>
      </div>

      {fornecedores.length === 0 ? (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">
              <TruckIcon size={24} />
            </div>
            <div className="empty-state-title">Nenhum fornecedor cadastrado</div>
            <p className="empty-state-sub">
              Cadastre prestadores de serviço e fornecedores de material para organizar sua operação.
            </p>
            <Link href="/dashboard/fornecedores/novo" className="btn btn-primary" style={{ marginTop: 8 }}>
              <PlusIcon size={15} />
              Cadastrar primeiro fornecedor
            </Link>
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
                  <th>Categorias</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Site</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600, color: "var(--clr-text)" }}>
                      {f.nome}
                    </td>
                    <td>
                      <span className={`badge badge-${f.tipo}`}>
                        {tipoLabel(f.tipo)}
                      </span>
                    </td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 12 }}>
                      {f.categorias ?? "—"}
                    </td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {f.telefone ?? "—"}
                    </td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {f.email ?? "—"}
                    </td>
                    <td style={{ color: "var(--clr-text-secondary)", fontSize: 13 }}>
                      {f.site ? (
                        <a href={f.site} target="_blank" rel="noopener noreferrer" style={{ color: "var(--clr-primary)", textDecoration: "none" }}>
                          {f.site.replace(/^https?:\/\//, "").split("/")[0]}
                        </a>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`badge badge-${f.status}`}>
                        {f.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/fornecedores/${f.id}`}
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
