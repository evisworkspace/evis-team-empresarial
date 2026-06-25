"use client";

import { useState } from "react";

type ClienteBasico = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
  estado: string | null;
};

type Props = {
  clientes: ClienteBasico[];
  defaultClienteId?: string;
  semClientes: boolean;
  origens: readonly { value: string; label: string }[];
};

export default function ClienteSelectorPanel({ clientes, defaultClienteId, semClientes, origens }: Props) {
  const [selectedId, setSelectedId] = useState(defaultClienteId ?? "");
  const [activeTab, setActiveTab] = useState<"existente" | "novo">(semClientes ? "novo" : "existente");

  const clienteSelecionado = clientes.find((c) => c.id === selectedId);

  return (
    <>
      {/* Tabs */}
      <input type="hidden" name="clienteMode" value={activeTab} />

      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "2px solid var(--clr-border)" }}>
        {(["existente", "novo"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? "var(--clr-primary)" : "var(--clr-text-muted)",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--clr-primary)" : "2px solid transparent",
              marginBottom: "-2px",
              cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            {tab === "existente" ? "Existente" : "Novo lead"}
          </button>
        ))}
      </div>

      {/* Seção: cliente existente */}
      {activeTab === "existente" && (
        <div>
          {semClientes ? (
            <p style={{ fontSize: 13, color: "var(--clr-text-muted)", padding: "12px 0" }}>
              Nenhum cliente cadastrado. Use a aba Novo lead ao lado.
            </p>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <label className="form-label">Selecionar cliente *</label>
                <select
                  name="clienteId"
                  className="form-input form-select"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">Escolha um cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                      {c.telefone ? ` — ${c.telefone}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {clienteSelecionado && (
                <div style={{
                  background: "var(--clr-bg-subtle)",
                  border: "1px solid var(--clr-border)",
                  borderRadius: "var(--r-md)",
                  padding: 12,
                  marginTop: 8,
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--clr-text)", marginBottom: 4 }}>
                    {clienteSelecionado.nome}
                  </div>
                  {clienteSelecionado.telefone && (
                    <div style={{ fontSize: 13, color: "var(--clr-text-muted)" }}>
                      {clienteSelecionado.telefone}
                    </div>
                  )}
                  {clienteSelecionado.email && (
                    <div style={{ fontSize: 13, color: "var(--clr-text-muted)" }}>
                      {clienteSelecionado.email}
                    </div>
                  )}
                  {(clienteSelecionado.cidade || clienteSelecionado.estado) && (
                    <div style={{ fontSize: 12, color: "var(--clr-text-muted)", marginTop: 2 }}>
                      {[clienteSelecionado.cidade, clienteSelecionado.estado].filter(Boolean).join(" — ")}
                    </div>
                  )}
                </div>
              )}

              <p style={{ fontSize: 12, color: "var(--clr-text-muted)", marginTop: 8 }}>
                Lead novo? Use a aba Novo lead ao lado.
              </p>
            </>
          )}
        </div>
      )}

      {/* Seção: novo cliente inline */}
      {activeTab === "novo" && (
        <div>
          <p style={{ fontSize: 12, color: "var(--clr-text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
            Dados mínimos. Informações completas podem ser adicionadas depois.
          </p>

          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input
              name="novoClienteNome"
              type="text"
              className="form-input"
              placeholder="Nome do cliente ou empresa"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp / Telefone</label>
            <input
              name="novoClienteTelefone"
              type="tel"
              className="form-input"
              placeholder="(00) 00000-0000"
              maxLength={30}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Como chegou até você?</label>
            <select name="novoClienteOrigem" className="form-input form-select" defaultValue="indicacao">
              <option value="">Não informado</option>
              {origens.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            background: "var(--clr-info-bg)",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            fontSize: 12,
            color: "var(--clr-info)",
            lineHeight: 1.6,
          }}>
            O cliente será criado junto com a oportunidade. Dados completos (email, CPF, endereço) podem ser adicionados após o fechamento.
          </div>
        </div>
      )}
    </>
  );
}
