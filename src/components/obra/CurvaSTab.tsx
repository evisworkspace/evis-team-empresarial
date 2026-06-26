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

  for (const i of valid) {
    const s = stripTime(i.dataInicioPlano!);
    const e = stripTime(i.dataFimPlano!);
    if (s < minDate) minDate = s;
    if (e > maxDate) maxDate = e;
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
      cost: costPerWeek,
    });

    currentStart = new Date(currentStart.getTime() + 7 * 86400000);
  }

  return weeks;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function CurvaSTab({ itens }: Props) {
  const weeks = calcWeeks(itens);

  if (!weeks) {
    return (
      <div className="obra-card obra-card--full">
        <div className="obra-card-header">
          <span className="obra-card-label">Curva S</span>
        </div>
        <div className="callout callout--info">
          Configure datas no Planejamento e garanta que os itens tenham custo para visualizar a Curva S.
        </div>
      </div>
    );
  }

  let acumulado = 0;

  return (
    <div className="obra-card obra-card--full">
      <div className="obra-card-header">
        <span className="obra-card-label">Curva S</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--clr-border)", color: "var(--clr-text-muted)" }}>
              <th style={{ textAlign: "left", padding: "8px 12px" }}>Semana</th>
              <th style={{ textAlign: "left", padding: "8px 12px" }}>Data Início</th>
              <th style={{ textAlign: "right", padding: "8px 12px" }}>Total planejado (período)</th>
              <th style={{ textAlign: "right", padding: "8px 12px" }}>Total acumulado</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, idx) => {
              acumulado += w.cost;
              return (
                <tr key={idx} style={{ borderBottom: "1px solid var(--clr-border-light)" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>Semana {idx + 1}</td>
                  <td style={{ padding: "8px 12px", color: "var(--clr-text-secondary)" }}>
                    {formatDate(w.start)}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                    {formatCurrency(w.cost)}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--clr-primary)" }}>
                    {formatCurrency(acumulado)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, fontSize: 13, color: "var(--clr-text-secondary)", background: "var(--clr-surface)", padding: "10px 14px", borderRadius: "var(--r-sm)" }}>
        ℹ️ Visualização em gráfico da evolução da Curva S estará disponível em fase futura.
      </div>
    </div>
  );
}
