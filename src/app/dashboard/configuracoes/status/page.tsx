import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { getOrSeedStatuses } from "@/data/statusProjeto"

export const metadata: Metadata = { title: "Status dos Projetos" }

export default async function ConfiguracoesStatusPage() {
  const session = await auth()
  const empresaId = getEmpresaId(session!)

  const [statusOp, statusObra] = await Promise.all([
    getOrSeedStatuses(empresaId, "oportunidade"),
    getOrSeedStatuses(empresaId, "obra"),
  ])

  const ativosOp   = statusOp.filter((s) => s.ativo)
  const fechadosOp = statusOp.filter((s) => !s.ativo)
  const ativosObra   = statusObra.filter((s) => s.ativo)
  const fechadosObra = statusObra.filter((s) => !s.ativo)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>
          Status dos projetos
        </h2>
        <p style={{ fontSize: 14, color: "var(--clr-text-secondary)", lineHeight: 1.6 }}>
          Status disponíveis para oportunidades e obras. Para editar, acesse o quadro Kanban e clique no ícone de engrenagem.
        </p>
      </div>

      <div
        style={{
          background: "var(--clr-info-bg)",
          border: "1px solid #bae6fd",
          borderRadius: "var(--r-md)",
          padding: "10px 16px",
          fontSize: 13,
          color: "var(--clr-info)",
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        Ao alterar o status de um projeto, a mudança reflete imediatamente na listagem e no quadro Kanban.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <StatusSection
          titulo="Oportunidades (CRM)"
          ativos={ativosOp}
          fechados={fechadosOp}
        />
        <StatusSection
          titulo="Obras"
          ativos={ativosObra}
          fechados={fechadosObra}
        />
      </div>
    </div>
  )
}

function StatusSection({
  titulo,
  ativos,
  fechados,
}: {
  titulo: string
  ativos: { id: string; slug: string; label: string; cor: string; ordem: number; ativo: boolean }[]
  fechados: { id: string; slug: string; label: string; cor: string; ordem: number; ativo: boolean }[]
}) {
  return (
    <div
      style={{
        background: "var(--clr-surface)",
        border: "1px solid var(--clr-border)",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--clr-border)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--clr-text)" }}>{titulo}</div>
      </div>

      <div style={{ padding: "12px 0 4px" }}>
        <div style={{ padding: "4px 20px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", fontFamily: "var(--font-mono)" }}>
          Ativos
        </div>
        {ativos.map((s) => <StatusRow key={s.id} status={s} />)}

        {fechados.length > 0 && (
          <>
            <div style={{ height: 1, background: "var(--clr-border)", margin: "8px 0" }} />
            <div style={{ padding: "4px 20px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", fontFamily: "var(--font-mono)" }}>
              Inativos
            </div>
            {fechados.map((s) => <StatusRow key={s.id} status={s} faded />)}
          </>
        )}
      </div>
    </div>
  )
}

function StatusRow({
  status,
  faded,
}: {
  status: { slug: string; label: string; cor: string }
  faded?: boolean
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", opacity: faded ? 0.55 : 1 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: status.cor,
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, fontSize: 13, color: "var(--clr-text)", fontWeight: 500 }}>
        {status.label}
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: "var(--r-full)",
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: status.cor + "22",
          color: status.cor,
          border: `1px solid ${status.cor}44`,
          whiteSpace: "nowrap",
        }}
      >
        {status.label}
      </span>
    </div>
  )
}
