import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listProjetosByEmpresaWithCliente } from "@/data/projeto";

function escapeCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function fmtMoney(v: unknown): string {
  const n = Number(v);
  if (!v || isNaN(n) || n === 0) return "";
  return n.toFixed(2).replace(".", ",");
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const empresaId = getEmpresaId(session);
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "csv";

  const projetos = await listProjetosByEmpresaWithCliente(empresaId, {
    stage: "oportunidade",
    take: 2000,
  });

  const STATUS_LABEL: Record<string, string> = {
    novo: "Agendar Visita",
    fila_espera: "Fila Espera",
    em_andamento: "Em andamento",
    proposta_enviada: "Proposta enviada",
    em_negociacao: "Em negociação",
    ganho: "Ganho",
    perdido: "Arquivado",
  };

  const header = ["#", "Título", "Cliente", "Status", "Valor Estimado", "Metragem", "Origem", "Criada em"];
  const rows = projetos.map((p, i) => {
    const pr = p as typeof p & { valorEstimado?: unknown; metragemEstimada?: unknown };
    return [
      String(i + 1),
      p.titulo,
      p.cliente?.nome ?? "",
      STATUS_LABEL[p.statusInterno] ?? p.statusInterno,
      fmtMoney(pr.valorEstimado),
      pr.metragemEstimada ? String(Number(pr.metragemEstimada)) : "",
      p.origem ?? "",
      fmtDate(p.createdAt),
    ];
  });

  if (format === "excel") {
    // Tab-separated values aberto pelo Excel
    const tsv = [header, ...rows].map((r) => r.join("\t")).join("\r\n");
    return new NextResponse("﻿" + tsv, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": 'attachment; filename="oportunidades.xls"',
      },
    });
  }

  // CSV padrão com BOM UTF-8
  const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\r\n");
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="oportunidades.csv"',
    },
  });
}
