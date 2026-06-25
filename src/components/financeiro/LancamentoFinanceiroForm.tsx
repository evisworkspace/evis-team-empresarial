"use client";

import { useEffect, useMemo, useState } from "react";

type SelectOption = { id: string; nome: string; tipo?: string };

type Props = {
  action: (fd: FormData) => Promise<void>;
  projetoId: string;
  categorias: SelectOption[];
  centrosCusto: SelectOption[];
  fornecedores: SelectOption[];
};

type Parcela = { data: string; valor: string };

const FORMAS_PAGAMENTO = [
  { value: "pix", label: "Pix" },
  { value: "ted", label: "TED" },
  { value: "boleto", label: "Boleto" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
];

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function moneyInput(value: number) {
  return value.toFixed(2);
}

export function LancamentoFinanceiroForm({
  action,
  projetoId,
  categorias,
  centrosCusto,
  fornecedores,
}: Props) {
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [nParcelas, setNParcelas] = useState(1);
  const [valorTotal, setValorTotal] = useState("");
  const [parcelas, setParcelas] = useState<Parcela[]>([{ data: "", valor: "" }]);

  const categoriasFiltradas = useMemo(() => {
    const tipoCategoria = tipo === "entrada" ? "receita" : "despesa";
    return categorias.filter((c) => !c.tipo || c.tipo === tipoCategoria);
  }, [categorias, tipo]);

  useEffect(() => {
    setParcelas((current) => {
      const firstDate = current[0]?.data ?? "";
      const total = parseFloat(valorTotal);
      const valorParcela = !isNaN(total) && total > 0 ? moneyInput(total / nParcelas) : "";
      const startDate = firstDate ? new Date(`${firstDate}T00:00:00`) : null;

      return Array.from({ length: nParcelas }, (_, index) => ({
        data: startDate ? formatInputDate(addMonths(startDate, index)) : "",
        valor: valorParcela,
      }));
    });
  }, [nParcelas, valorTotal]);

  function updateParcela(index: number, field: keyof Parcela, value: string) {
    setParcelas((current) => {
      const next = current.map((p, i) => (i === index ? { ...p, [field]: value } : p));

      if (field === "data" && index === 0 && value) {
        const startDate = new Date(`${value}T00:00:00`);
        return next.map((p, i) => ({ ...p, data: formatInputDate(addMonths(startDate, i)) }));
      }

      return next;
    });
  }

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input type="hidden" name="projetoId" value={projetoId} />
      <input type="hidden" name="nParcelas" value={nParcelas} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
          Tipo
          <select
            name="tipo"
            className="form-input form-select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "entrada" | "saida")}
            required
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
          Descrição
          <input name="descricao" type="text" className="form-input" placeholder="Ex: sinal, medição, material" maxLength={200} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
          Categoria financeira
          <select name="categoriaFinanceiraId" className="form-input form-select">
            <option value="">Sem categoria</option>
            {categoriasFiltradas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
          Centro de custo
          <select name="centroDeCustoId" className="form-input form-select">
            <option value="">Sem centro</option>
            {centrosCusto.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {nParcelas === 1 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
            Valor
            <input name="valor" type="number" step="0.01" min="0.01" className="form-input" placeholder="R$" required />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
            Vencimento
            <input name="dataVencimento" type="date" className="form-input" required />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
            Parcelas
            <select
              className="form-input form-select"
              value={nParcelas}
              onChange={(e) => setNParcelas(Math.min(Math.max(parseInt(e.target.value, 10), 1), 18))}
            >
              {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
              Valor total
              <input
                name="valorTotal"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                required
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
              Número de parcelas
              <select
                className="form-input form-select"
                value={nParcelas}
                onChange={(e) => setNParcelas(Math.min(Math.max(parseInt(e.target.value, 10), 1), 18))}
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ maxHeight: nParcelas > 6 ? 260 : undefined, overflowY: nParcelas > 6 ? "auto" : undefined }}>
            <table className="evis-table">
              <thead>
                <tr>
                  <th>Parcela</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {parcelas.map((parcela, index) => (
                  <tr key={index}>
                    <td style={{ fontSize: 13, color: "var(--clr-text-secondary)" }}>{index + 1}/{nParcelas}</td>
                    <td>
                      <input
                        name={`parcela_data_${index + 1}`}
                        type="date"
                        className="form-input"
                        value={parcela.data}
                        onChange={(e) => updateParcela(index, "data", e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        name={`parcela_valor_${index + 1}`}
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-input"
                        value={parcela.valor}
                        onChange={(e) => updateParcela(index, "valor", e.target.value)}
                        required
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <details>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--clr-primary)" }}>
          Mais detalhes
        </summary>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
            Forma de pagamento
            <select name="formaPagamento" className="form-input form-select">
              <option value="">Não definida</option>
              {FORMAS_PAGAMENTO.map((forma) => (
                <option key={forma.value} value={forma.value}>
                  {forma.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
            Conta bancária
            <input name="contaBancaria" type="text" className="form-input" maxLength={100} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
            Nota fiscal
            <input name="notaFiscal" type="text" className="form-input" maxLength={200} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--clr-text-muted)" }}>
            Fornecedor
            <select name="fornecedorId" className="form-input form-select">
              <option value="">Sem fornecedor</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>

      <div>
        <button type="submit" className="btn btn-primary btn-sm">
          Registrar lançamento
        </button>
      </div>
    </form>
  );
}
