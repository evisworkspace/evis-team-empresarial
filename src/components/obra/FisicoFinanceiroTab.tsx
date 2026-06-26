import React from "react";

type Item = {
  dataInicioPlano: Date | null;
  dataFimPlano: Date | null;
  custoTotal: number | null;
  descricao: string;
};

type Props = {
  itens: Item[];
};

function stripTime(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function getMonday(d: Date) {
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
}

function calcWeeks(itens: Item[]) {
  const valid = itens.filter(i => i.dataInicioPlano && i.dataFimPlano && (i.custoTotal ?? 0) > 0);
  if (valid.length === 0) return null;

  let minDate = new Date(8640000000000000);
  let maxDate = new Date(-8640000000000000);
  let totalProjeto = 0;

  for (const i of valid) {
    const s = stripTime(i.dataInicioPlano!);
    const e = stripTime(i.dataFimPlano!);
    if (s < minDate) minDate = s;
    if (e > maxDate) maxDate = e;
    totalProjeto += i.custoTotal!;
  }

  const weeks = [];
  let currentStart = getMonday(minDate);

  while (currentStart <= maxDate && weeks.length < 16) {
    const currentEnd = new Date(currentStart.getTime() + 6 * 86400000);
    let costPerWeek = 0;

    for (const i of valid) {
      const is = stripTime(i.dataInicioPlano!);
      const ie = stripTime(i.dataFimPlano!);
      const totalDays = Math.round((ie.getTime() - is.getTime()) / 86400000) + 1;
      const dailyCost = i.custoTotal! / totalDays;

      const overlapStart = new Date(Math.max(is.getTime(), currentStart.getTime()));
      const overlapEnd = new Date(Math.min(ie.getTime(), currentEnd.getTime()));

      if (overlapStart <= overlapEnd) {
        const overlapDays = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1;
        costPerWeek += overlapDays * dailyCost;
      }
    }

    weeks.push({
      start: currentStart,
      end: currentEnd,
      cost: costPerWeek,
    });

    currentStart = new Date(currentStart.getTime() + 7 * 86400000);
  }

  return { weeks, totalProjeto };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function FisicoFinanceiroTab({ itens }: Props) {
  const data = calcWeeks(itens);

  if (!data) {
    return (
      <div className="obra-card obra-card--full">
        <div className="obra-card-header">
          <span className="obra-card-label">Cronograma Físico-Financeiro</span>
        </div>
        <div className="callout callout--info">
          Configure datas no Planejamento e garanta que os itens tenham custo para visualizar o cronograma financeiro.
        </div>
      </div>
    );
  }

  let acumulado = 0;

  return (
    <div className="obra-card obra-card--full">
      <div className="obra-card-header">
        <span className="obra-card-label">Cronograma Físico-Financeiro</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--clr-border)", color: "var(--clr-text-muted)" }}>
              <th style={{ textAlign: "left", padding: "8px 12px" }}>Semana</th>
              <th style={{ textAlign: "left", padding: "8px 12px" }}>Período</th>
              <th style={{ textAlign: "right", padding: "8px 12px" }}>Custo do período</th>
              <th style={{ textAlign: "right", padding: "8px 12px" }}>% do total</th>
              <th style={{ textAlign: "right", padding: "8px 12px" }}>Acumulado</th>
              <th style={{ textAlign: "right", padding: "8px 12px" }}>% acumulado</th>
            </tr>
          </thead>
          <tbody>
            {data.weeks.map((w, idx) => {
              acumulado += w.cost;
              const pct = data.totalProjeto > 0 ? (w.cost / data.totalProjeto) * 100 : 0;
              const pctAcumulado = data.totalProjeto > 0 ? (acumulado / data.totalProjeto) * 100 : 0;
              return (
                <tr key={idx} style={{ borderBottom: "1px solid var(--clr-border-light)" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>Semana {idx + 1}</td>
                  <td style={{ padding: "8px 12px", color: "var(--clr-text-secondary)" }}>
                    {formatDate(w.start)} a {formatDate(w.end)}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{formatCurrency(w.cost)}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--clr-text-secondary)" }}>{pct.toFixed(2)}%</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--clr-success)" }}>
                    {formatCurrency(acumulado)}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>{Math.min(100, pctAcumulado).toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: "var(--clr-text-muted)" }}>
        O valor é rateado proporcionalmente aos dias previstos de cada serviço. Exibe no máximo 16 semanas.
      </div>
    </div>
  );
}
