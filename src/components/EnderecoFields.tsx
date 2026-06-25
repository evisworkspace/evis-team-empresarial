"use client";

import { useState } from "react";

interface FieldNames {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface Props {
  fieldNames: FieldNames;
  defaults?: Partial<Record<keyof FieldNames, string>>;
  logradouroLabel?: string;
  marginTop?: number;
}

export default function EnderecoFields({
  fieldNames,
  defaults = {},
  logradouroLabel = "Rua / Logradouro",
  marginTop = 24,
}: Props) {
  const [logradouro, setLogradouro] = useState(defaults.logradouro ?? "");
  const [bairro, setBairro] = useState(defaults.bairro ?? "");
  const [cidade, setCidade] = useState(defaults.cidade ?? "");
  const [estado, setEstado] = useState(defaults.estado ?? "");
  const [loading, setLoading] = useState(false);
  const [cepError, setCepError] = useState(false);

  async function buscarCep(value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setLoading(true);
    setCepError(false);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError(true);
      } else {
        setLogradouro(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidade(data.localidade ?? "");
        setEstado(data.uf ?? "");
      }
    } catch {
      // falha silenciosa — usuário preenche manualmente
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="form-group" style={{ marginTop }}>
        <label className="form-label">
          CEP
          {loading && (
            <span style={{ fontSize: 11, color: "var(--clr-text-muted)", marginLeft: 6 }}>
              buscando...
            </span>
          )}
          {cepError && (
            <span style={{ fontSize: 11, color: "var(--clr-danger)", marginLeft: 6 }}>
              CEP não encontrado
            </span>
          )}
        </label>
        <input
          name={fieldNames.cep}
          type="text"
          className="form-input"
          defaultValue={defaults.cep ?? ""}
          onBlur={(e) => buscarCep(e.target.value)}
          placeholder="00000-000"
          maxLength={10}
        />
      </div>

      <div className="form-group">
        <label className="form-label">{logradouroLabel}</label>
        <input
          name={fieldNames.logradouro}
          type="text"
          className="form-input"
          value={logradouro}
          onChange={(e) => setLogradouro(e.target.value)}
          placeholder="Rua, Avenida, Estrada..."
          maxLength={200}
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Número</label>
          <input
            name={fieldNames.numero}
            type="text"
            className="form-input"
            defaultValue={defaults.numero ?? ""}
            placeholder="Ex: 123"
            maxLength={20}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Complemento</label>
          <input
            name={fieldNames.complemento}
            type="text"
            className="form-input"
            defaultValue={defaults.complemento ?? ""}
            placeholder="Apto, Sala, Bloco..."
            maxLength={100}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Bairro</label>
        <input
          name={fieldNames.bairro}
          type="text"
          className="form-input"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          placeholder="Bairro"
          maxLength={100}
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Cidade</label>
          <input
            name={fieldNames.cidade}
            type="text"
            className="form-input"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade"
            maxLength={100}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Estado</label>
          <input
            name={fieldNames.estado}
            type="text"
            className="form-input"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            placeholder="SP"
            maxLength={2}
          />
        </div>
      </div>
    </>
  );
}
