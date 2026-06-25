"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UsersIcon, BuildingIcon, SettingsIcon } from "@/components/Icons"

const itens = [
  { href: "/dashboard/configuracoes/perfil", label: "Perfil", Icon: SettingsIcon },
  { href: "/dashboard/configuracoes/empresa", label: "Empresa", Icon: BuildingIcon },
  { href: "/dashboard/configuracoes/equipe", label: "Equipe", Icon: UsersIcon },
]

export function ConfiguracoesNav() {
  const pathname = usePathname()
  return (
    <nav className="settings-nav">
      <span className="settings-nav-title">Configurações</span>
      {itens.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`settings-nav-link ${pathname === href ? "active" : ""}`}
        >
          <Icon size={16} className="sidebar-link-icon" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
