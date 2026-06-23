import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getProjetoWithDetails } from "@/data/projeto";
import { confirmarConversaoComCliente } from "@/actions/projeto";
import { UsersIcon, BuildingIcon, ArrowRightIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Confirmar Conversão em Obra" };

const TIPO_PESSOA_OPTIONS = [
  { value: "PF", label: "Pessoa Física" },
  { value: "PJ", label: "Pessoa Jurídica" },
];

const ORIGEM_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "indicacao", label: "Indicação" },
  { value: "instagram", label: "Instagram" },
  { value: "site", label: "Site" },
  { value: "telefone", label: "Telefone" },
  { value: "cliente_antigo", label: "Cliente antigo" },
  { value: "prospeccao_ativa", label: "Prospecção ativa" },
  { value: "outro", label: "Outro" },
];

export default async function ConfirmarConversaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { id } = await params;

  const projeto = await getProjetoWithDetails(empresaId, id);
  if (!projeto) notFound();

  if (projeto.stage !== "oportunidade" || projeto.statusInterno !== "ganho") {
    return (
      <div>
        <Link href={`/dashboard/projetos/${id}`} className="back-link">
          ← Voltar para a oportunidade
        </Link>
        <div className="callout callout--info" style={{ marginTop: 24 }}>
          Esta oportunidade não está no estado correto para conversão.
          Para converter em obra, avance o funil até <strong>Ganho</strong>.
        </div>
      </div>
    );
  }

  const cliente = projeto.cliente;

  return (
    <div>
      <Link href={`/dashboard/projetos/${id}`} className="back-link">
        ← Voltar para a oportunidade
      </Link>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span className="badge badge-oportunidade">Oportunidade</span>
          <ArrowRightIcon size={14} />
          <span className="badge badge-obra">Obra</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>
          Confirmar conversão em obra
        </h1>
        <p style={{ fontSize: 14, color: "var(--clr-text-muted)" }}>
          Revise os dados do cliente antes de converter. O mesmo registro será mantido — nada se perde.
        </p>
      </div>

      {/* Resumo da oportunidade */}
      <div className="obra-card" style={{ marginBottom: 20 }}>
        <div className="obra-card-header">
          <span className="obra-card-label"><BuildingIcon size={13} /> Oportunidade a converter</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Título", value: projeto.titulo },
            { label: "Status atual", value: "Ganho ✓" },
            ...(projeto.numeroObra ? [{ label: "Número", value: `#${projeto.numeroObra}` }] : []),
            ...(projeto.origem ? [{ label: "Origem", value: projeto.origem }] : []),
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                borderBottom: "1px solid var(--clr-border-light)",
                paddingBottom: 6,
              }}
            >
              <span style={{ color: "var(--clr-text-muted)" }}>{label}</span>
              <span style={{ color: "var(--clr-text)", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário: completar dados do cliente + confirmar conversão */}
      <form action={confirmarConversaoComCliente}>
        <input type="hidden" name="projetoId" value={id} />
        <input type="hidden" name="clienteId" value={cliente?.id ?? ""} />

        <div className="form-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <UsersIcon size={16} />
            <div className="form-card-title" style={{ marginBottom: 0 }}>Dados do cliente</div>
          </div>
          <p style={{ fontSize: 13, color: "var(--clr-text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
            Revise e complete os dados. Estes dados vão para o contrato e execução da obra.
            Campos de email, CPF/CNPJ e endereço serão adicionados em breve.
          </p>

          <div className="form-group">
            <label className="form-label">Nome completo / Razão social *</label>
            <input
              name="clienteNome"
              type="text"
              className="form-input"
              defaultValue={cliente?.nome ?? ""}
              required
              minLength={2}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp / Telefone</label>
            <input
              name="clienteTelefone"
              type="tel"
              className="form-input"
              defaultValue={cliente?.telefone ?? ""}
              placeholder="(00) 00000-0000"
              maxLength={30}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tipo de pessoa</label>
              <select
                name="clienteTipoPessoa"
                className="form-input form-select"
                defaultValue={cliente?.tipoPessoa ?? "PF"}
              >
                {TIPO_PESSOA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Como chegou até você?</label>
              <select
                name="clienteOrigemContato"
                className="form-input form-select"
                defaultValue={cliente?.origemContato ?? ""}
              >
                <option value="">Não informado</option>
                {ORIGEM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              background: "var(--clr-warning-bg)",
              borderRadius: "var(--r-md)",
              padding: "10px 14px",
              fontSize: 12,
              color: "var(--clr-warning)",
              lineHeight: 1.7,
              marginTop: 16,
            }}
          >
            <strong>Lacunas no schema atual:</strong> email, CPF/CNPJ e endereço do cliente ainda não existem no sistema.
            Esses campos serão adicionados na próxima fase de schema.
          </div>
        </div>

        <div
          style={{
            background: "var(--clr-success-bg)",
            border: "1px solid #bbf7d0",
            borderRadius: "var(--r-lg)",
            padding: "20px 24px",
            marginTop: 20,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--clr-success)", marginBottom: 8 }}>
            O que acontece ao confirmar
          </div>
          <ul style={{ fontSize: 13, color: "var(--clr-text-secondary)", lineHeight: 2, paddingLeft: 16, margin: 0 }}>
            <li>Os dados do cliente são atualizados</li>
            <li>O <strong>mesmo registro</strong> muda de Oportunidade para Obra</li>
            <li>O ID é preservado — nenhum dado é perdido</li>
            <li>Tarefas, financeiro, orçamento e histórico permanecem</li>
            <li>O workspace de obra abre automaticamente</li>
          </ul>

          <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: 15, padding: "10px 24px" }}>
              Confirmar — Virar Obra
              <ArrowRightIcon size={15} />
            </button>
            <Link href={`/dashboard/projetos/${id}`} className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
