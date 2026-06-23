import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getFornecedorByEmpresa } from "@/data/fornecedor";
import { PhoneIcon, TruckIcon, EditIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Fornecedor" };

function tipoLabel(tipo: string) {
  const map: Record<string, string> = {
    servico: "Prestador de Serviço",
    material: "Fornecedor de Material",
    ambos: "Serviço + Material",
  };
  return map[tipo] ?? tipo;
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default async function FornecedorDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { id } = await params;

  const fornecedor = await getFornecedorByEmpresa(empresaId, id);
  if (!fornecedor) notFound();

  return (
    <div>
      <Link href="/dashboard/fornecedores" className="back-link">
        ← Fornecedores
      </Link>

      {/* Header */}
      <div className="obra-header">
        <div className="obra-title-block">
          <div className="obra-meta">
            <span className={`badge badge-${fornecedor.tipo}`}>{tipoLabel(fornecedor.tipo)}</span>
            <span className={`badge badge-${fornecedor.status}`}>
              {fornecedor.status === "ativo" ? "Ativo" : "Inativo"}
            </span>
          </div>
          <h1 className="obra-title">{fornecedor.nome}</h1>
          {fornecedor.contato && (
            <div className="obra-meta">
              <span className="obra-meta-item">
                <PhoneIcon size={13} />
                {fornecedor.contato}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={`/dashboard/fornecedores/${fornecedor.id}/editar`}
            className="btn btn-secondary btn-sm"
          >
            <EditIcon size={14} />
            Editar
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="obra-grid">
        {/* Dados */}
        <div className="obra-card">
          <div className="obra-card-header">
            <span className="obra-card-label">
              <TruckIcon size={13} />
              Dados do fornecedor
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Nome", value: fornecedor.nome },
              { label: "Tipo", value: tipoLabel(fornecedor.tipo) },
              { label: "Contato", value: fornecedor.contato ?? "—" },
              { label: "Status", value: fornecedor.status },
              { label: "Cadastrado em", value: formatDate(fornecedor.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid var(--clr-border-light)", paddingBottom: 6 }}>
                <span style={{ color: "var(--clr-text-muted)" }}>{label}</span>
                <span style={{ color: "var(--clr-text)", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Obras vinculadas — placeholder */}
        <div className="obra-card">
          <div className="obra-card-header">
            <span className="obra-card-label">Obras vinculadas</span>
          </div>
          <div className="placeholder-block">
            Vínculo direto de fornecedor por obra disponível em breve.
          </div>
        </div>

        {/* Lançamentos financeiros — placeholder */}
        <div className="obra-card">
          <div className="obra-card-header">
            <span className="obra-card-label">Lançamentos financeiros</span>
          </div>
          <div className="placeholder-block">
            Histórico financeiro por fornecedor disponível em breve.
          </div>
        </div>
      </div>
    </div>
  );
}
