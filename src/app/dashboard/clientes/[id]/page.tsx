import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getClienteByEmpresa } from "@/data/cliente";
import { PhoneIcon, BuildingIcon, PlusIcon, ArrowRightIcon, EditIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Cliente" };

function stageBadge(stage: string) {
  return stage === "obra" ? "badge badge-obra" : "badge badge-oportunidade";
}

function stageLabel(stage: string) {
  return stage === "obra" ? "Obra" : "Oportunidade";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    novo: "Novo lead",
    em_negociacao: "Em negociação",
    proposta_enviada: "Proposta enviada",
    ganho: "Ganho",
    perdido: "Perdida",
    abertura: "Abertura",
    planejamento: "Planejamento",
    em_andamento: "Em andamento",
    pausada: "Pausada",
    concluida: "Concluída",
    entregue: "Entregue",
    encerrada: "Encerrada",
    aberta: "Aberta",
  };
  return map[status] ?? status;
}

export default async function ClienteDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { id } = await params;

  const cliente = await getClienteByEmpresa(empresaId, id);
  if (!cliente) notFound();

  const projetos = cliente.projetos ?? [];
  const obrasCount = projetos.filter((p) => p.stage === "obra").length;
  const opCount = projetos.filter((p) => p.stage === "oportunidade").length;

  return (
    <div>
      <Link href="/dashboard/clientes" className="back-link">
        ← Clientes
      </Link>

      {/* Header */}
      <div className="obra-header">
        <div className="obra-title-block">
          <div className="obra-meta">
            <span className={`badge badge-${cliente.status}`}>
              {cliente.status === "ativo" ? "Ativo" : "Inativo"}
            </span>
            {cliente.tipoPessoa && (
              <span className="tipo-tag">{cliente.tipoPessoa}</span>
            )}
          </div>
          <h1 className="obra-title">{cliente.nome}</h1>
          <div className="obra-meta">
            {cliente.telefone && (
              <span className="obra-meta-item">
                <PhoneIcon size={13} />
                {cliente.telefone}
              </span>
            )}
            {cliente.origemContato && (
              <span className="obra-meta-item">
                · Origem: {cliente.origemContato}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={`/dashboard/clientes/${cliente.id}/editar`}
            className="btn btn-secondary btn-sm"
          >
            <EditIcon size={14} />
            Editar
          </Link>
          <Link
            href={`/dashboard/clientes/${cliente.id}/excluir`}
            className="btn btn-secondary btn-sm"
            style={{ color: "var(--clr-danger)", borderColor: "currentColor" }}
          >
            Excluir
          </Link>
          <Link
            href={`/dashboard/projetos/novo?clienteId=${cliente.id}`}
            className="btn btn-primary btn-sm"
          >
            <PlusIcon size={14} />
            Nova obra / oportunidade
          </Link>
        </div>
      </div>

      {/* Grid de info */}
      <div className="obra-grid">

        {/* Projetos e obras unificados */}
        <div className="obra-card obra-card--full">
          <div className="obra-card-header">
            <span className="obra-card-label">
              <BuildingIcon size={13} />
              Projetos e Obras ({projetos.length})
            </span>
            <span style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>
              {obrasCount} obra{obrasCount !== 1 ? "s" : ""} · {opCount} oportunidade{opCount !== 1 ? "s" : ""}
            </span>
          </div>
          {projetos.length === 0 ? (
            <div className="placeholder-block">
              Nenhum projeto ou obra vinculado a este cliente.{" "}
              <Link href={`/dashboard/projetos/novo`} style={{ color: "var(--clr-primary)" }}>
                Criar primeiro
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {projetos.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projetos/${p.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--clr-border-light)",
                    color: "inherit",
                    textDecoration: "none",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--clr-text)" }}>
                      {p.titulo}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--clr-text-muted)", marginTop: 2 }}>
                      {statusLabel(p.statusInterno)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span className={stageBadge(p.stage)} style={{ fontSize: 10 }}>
                      {stageLabel(p.stage)}
                    </span>
                    <ArrowRightIcon size={13} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Dados */}
        <div className="obra-card">
          <div className="obra-card-header">
            <span className="obra-card-label">Dados do cliente</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Nome", value: cliente.nome },
              { label: "Tipo", value: cliente.tipoPessoa ?? "—" },
              ...(cliente.razaoSocial ? [{ label: "Razão Social", value: cliente.razaoSocial }] : []),
              ...(cliente.cpfCnpj ? [{ label: "CPF / CNPJ", value: cliente.cpfCnpj }] : []),
              ...(cliente.email ? [{ label: "E-mail", value: cliente.email }] : []),
              { label: "Telefone", value: cliente.telefone ?? "—" },
              { label: "Origem", value: cliente.origemContato ?? "—" },
              { label: "Status", value: cliente.status },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid var(--clr-border-light)", paddingBottom: 6 }}>
                <span style={{ color: "var(--clr-text-muted)" }}>{label}</span>
                <span style={{ color: "var(--clr-text)", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            {(cliente.rua || cliente.cidade) && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid var(--clr-border-light)", paddingBottom: 6 }}>
                <span style={{ color: "var(--clr-text-muted)" }}>Endereço</span>
                <span style={{ color: "var(--clr-text)", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>
                  {[
                    cliente.rua,
                    cliente.numero,
                    cliente.complemento,
                    cliente.bairro,
                    cliente.cidade,
                    cliente.estado,
                  ].filter(Boolean).join(", ")}
                  {cliente.cep ? ` — CEP ${cliente.cep}` : ""}
                </span>
              </div>
            )}
            {cliente.observacoes && (
              <div style={{ fontSize: 13, paddingTop: 4 }}>
                <div style={{ color: "var(--clr-text-muted)", marginBottom: 4 }}>Observações</div>
                <div style={{ color: "var(--clr-text)", lineHeight: 1.6 }}>{cliente.observacoes}</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
