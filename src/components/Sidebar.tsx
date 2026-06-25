"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  DashboardIcon,
  BuildingIcon,
  UsersIcon,
  TruckIcon,
  TasksIcon,
  AgentsIcon,
  SignOutIcon,
  FinanceIcon,
  ChevronDownIcon,
  ZapIcon,
  SettingsIcon,
} from "@/components/Icons";
import { handleSignOut } from "@/actions/auth";

interface SidebarProps {
  userName: string;
  companyName: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function Sidebar({ userName, companyName }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [financeiroOpen, setFinanceiroOpen] = useState(false);

  function isActive(href: string) {
    const [path, query] = href.split("?");
    if (path === "/dashboard") return pathname === "/dashboard";
    if (query) {
      const params = new URLSearchParams(query);
      const stage = params.get("stage");
      if (stage) {
        return pathname === "/dashboard/projetos" && searchParams.get("stage") === stage;
      }
    }
    return pathname.startsWith(path);
  }

  return (
    <aside className="sidebar">
      {/* Logo v2 — AiStudio */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-row">
          <div className="sidebar-logo-badge">
            <span className="sidebar-logo-badge-letter">E</span>
          </div>
          <div className="sidebar-logo-text-block">
            <div className="sidebar-logo-name-row">
              EVIS
              <span className="sidebar-erp-chip">ERP</span>
            </div>
            <div className="sidebar-logo-company-mono" title={companyName}>
              {companyName}
            </div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* Dashboard */}
        <div className="sidebar-section">
          <Link
            href="/dashboard"
            className={`sidebar-link ${isActive("/dashboard") ? "active" : ""}`}
          >
            <DashboardIcon className="sidebar-link-icon" />
            Painel de Controle
          </Link>
        </div>

        {/* Projetos & CRM */}
        <div className="sidebar-section">
          <span className="sidebar-section-label-mono">Projetos &amp; CRM</span>
          <Link
            href="/dashboard/projetos?stage=oportunidade"
            className={`sidebar-link ${isActive("/dashboard/projetos?stage=oportunidade") ? "active" : ""}`}
          >
            <BuildingIcon className="sidebar-link-icon" />
            Oportunidades
          </Link>
          <Link
            href="/dashboard/projetos?stage=obra"
            className={`sidebar-link ${isActive("/dashboard/projetos?stage=obra") ? "active" : ""}`}
          >
            <BuildingIcon className="sidebar-link-icon" />
            Obras
          </Link>
          <Link
            href="/dashboard/tarefas"
            className={`sidebar-link ${isActive("/dashboard/tarefas") ? "active" : ""}`}
          >
            <TasksIcon className="sidebar-link-icon" />
            Tarefas
          </Link>
        </div>

        {/* Financeiro Obra (collapsible) */}
        <div className="sidebar-section">
          <button
            className="sidebar-collapsible-btn"
            onClick={() => setFinanceiroOpen(!financeiroOpen)}
          >
            <span className="sidebar-section-label-mono" style={{ padding: 0, marginBottom: 0 }}>
              Financeiro Obra
            </span>
            <ChevronDownIcon
              size={14}
              className={`sidebar-collapsible-chevron${financeiroOpen ? " sidebar-collapsible-chevron--open" : ""}`}
            />
          </button>
          {financeiroOpen && (
            <div className="sidebar-sub-nav">
              <Link
                href="/dashboard/financeiro"
                className={`sidebar-link ${isActive("/dashboard/financeiro") ? "active" : ""}`}
              >
                <FinanceIcon className="sidebar-link-icon" />
                Financeiro
              </Link>
            </div>
          )}
        </div>

        {/* Cadastros */}
        <div className="sidebar-section">
          <span className="sidebar-section-label-mono">Cadastros</span>
          <Link
            href="/dashboard/clientes"
            className={`sidebar-link ${isActive("/dashboard/clientes") ? "active" : ""}`}
          >
            <UsersIcon className="sidebar-link-icon" />
            Clientes
          </Link>
          <Link
            href="/dashboard/fornecedores"
            className={`sidebar-link ${isActive("/dashboard/fornecedores") ? "active" : ""}`}
          >
            <TruckIcon className="sidebar-link-icon" />
            Fornecedores
          </Link>
        </div>

        {/* Configurações */}
        <div className="sidebar-section">
          <Link
            href="/dashboard/configuracoes/perfil"
            className={`sidebar-link ${isActive("/dashboard/configuracoes") ? "active" : ""}`}
          >
            <SettingsIcon className="sidebar-link-icon" />
            Configurações
          </Link>
        </div>

        {/* IA */}
        <div className="sidebar-section">
          <span className="sidebar-section-label-mono">IA</span>
          <Link
            href="/dashboard/triagem"
            className={`sidebar-link ${isActive("/dashboard/triagem") ? "active" : ""}`}
          >
            <AgentsIcon className="sidebar-link-icon" />
            Triagem IA — Lia
          </Link>
          <div className="sidebar-link-disabled">
            <AgentsIcon className="sidebar-link-icon" />
            Agentes EVIS
            <span className="sidebar-link-soon">Em breve</span>
          </div>
        </div>
      </nav>

      {/* Footer — plano + usuário */}
      <div className="sidebar-footer">
        <div className="sidebar-plan-card">
          <div className="sidebar-plan-header">
            <span className="sidebar-plan-badge">PLANO GRATUITO</span>
            <ZapIcon size={14} className="sidebar-plan-zap" />
          </div>
          <p className="sidebar-plan-text">
            Sua construtora opera no plano gratuito.
          </p>
          <button className="sidebar-plan-btn">
            Fazer Upgrade Pro
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(userName)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" title={userName}>{userName}</div>
            <div className="sidebar-user-role">Admin</div>
          </div>
          <form action={handleSignOut}>
            <button type="submit" className="sidebar-signout-btn" title="Sair">
              <SignOutIcon size={15} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
