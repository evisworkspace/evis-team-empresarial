"use client";

import { useState } from "react";

export interface CnpjData {
  razao_social: string;
  nome_fantasia: string;
  email: string;
  ddd_telefone_1: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

interface Props {
  name: string;
  defaultValue?: string;
  onLoaded: (data: CnpjData) => void;
  placeholder?: string;
}

export default function CnpjInput({
  name,
  defaultValue = "",
  onLoaded,
  placeholder = "00.000.000/0001-00",
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function buscar(value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length !== 14) return;
    setStatus("loading");
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) { setStatus("error"); return; }
      const data = (await res.json()) as CnpjData;
      onLoaded(data);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <input
        name={name}
        type="text"
        className="form-input"
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={20}
        onBlur={(e) => buscar(e.target.value)}
      />
      {status === "loading" && (
        <span style={{ fontSize: 11, color: "var(--clr-text-muted)", marginTop: 3, display: "block" }}>
          Buscando dados na Receita Federal...
        </span>
      )}
      {status === "ok" && (
        <span style={{ fontSize: 11, color: "#16a34a", marginTop: 3, display: "block" }}>
          Dados preenchidos automaticamente. Revise antes de salvar.
        </span>
      )}
      {status === "error" && (
        <span style={{ fontSize: 11, color: "var(--clr-danger)", marginTop: 3, display: "block" }}>
          CNPJ não encontrado. Preencha manualmente.
        </span>
      )}
    </div>
  );
}
