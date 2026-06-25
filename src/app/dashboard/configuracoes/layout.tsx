import type { Metadata } from "next"
import { ConfiguracoesNav } from "@/components/ConfiguracoesNav"

export const metadata: Metadata = { title: "Configurações" }

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--clr-text)", letterSpacing: "-0.02em" }}>
          Configurações
        </h1>
        <p style={{ fontSize: 14, color: "var(--clr-text-secondary)", marginTop: 4 }}>
          Gerencie seu perfil, empresa e equipe.
        </p>
      </div>
      <div className="settings-layout">
        <ConfiguracoesNav />
        <div className="settings-content">{children}</div>
      </div>
    </div>
  )
}
