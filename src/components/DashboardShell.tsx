"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MenuIcon } from "@/components/Icons";

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
  companyName: string;
}

export function DashboardShell({ children, userName, companyName }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Fecha a sidebar automaticamente quando a rota muda no mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="app-shell">
      {/* Overlay escuro quando sidebar está aberta no mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar 
        userName={userName} 
        companyName={companyName} 
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <MenuIcon size={20} />
            </button>
            <span className="topbar-title">{companyName}</span>
          </div>
          <div className="topbar-right">
            <span className="env-badge env-badge--dev">
              <span className="env-badge--dot" />
              Dev
            </span>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
