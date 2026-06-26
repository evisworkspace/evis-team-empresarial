import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listAtividadesGlobais } from "@/data/projetoAtividade";
import { ActivityIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Diário" };

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const TIPO_LABEL: Record<string, string> = {
  ligacao: "Ligação",
  visita: "Visita",
  email: "E-mail",
  reuniao: "Reunião",
  nota: "Nota",
  outro: "Outro",
};

export default async function DiarioPage() {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const atividades = await listAtividadesGlobais(empresaId, 200);

  // Agrupar por dia (YYYY-MM-DD no fuso local do servidor)
  const grupos = new Map<string, typeof atividades>();
  for (const a of atividades) {
    const dia = new Date(a.createdAt).toISOString().slice(0, 10);
    if (!grupos.has(dia)) grupos.set(dia, []);
    grupos.get(dia)!.push(a);
  }

  const dias = [...grupos.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.16em",
              color: "var(--clr-primary)", marginBottom: 8,
            }}>
              <ActivityIcon size={13} />
              Gestão
            </div>
            <h1 className="page-title">Diário</h1>
            <p className="page-subtitle">{atividades.length} registro{atividades.length !== 1 ? "s" : ""} nos últimos 200</p>
          </div>
        </div>
      </div>

      {atividades.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <p style={{ color: "var(--clr-text-muted)", fontSize: 14 }}>
            Nenhum registro ainda. Atividades de projetos e obras aparecerão aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {dias.map(([dia, itens]) => (
            <div key={dia}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.12em",
                color: "var(--clr-text-muted)", marginBottom: 10,
                paddingBottom: 6, borderBottom: "1px solid var(--clr-border)",
              }}>
                {formatDayLabel(dia)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {itens.map((a) => (
                  <div key={a.id} style={{
                    display: "flex", gap: 16, alignItems: "flex-start",
                    background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
                    borderRadius: "var(--r-md)", padding: "12px 16px",
                  }}>
                    <div style={{
                      fontFamily: "var(--font-mono)", fontSize: 11,
                      color: "var(--clr-text-muted)", whiteSpace: "nowrap",
                      minWidth: 44, paddingTop: 2,
                    }}>
                      {formatTime(a.createdAt)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "var(--clr-text)", lineHeight: 1.5 }}>
                        {a.descricao}
                      </div>
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {a.tipo !== "outro" && (
                          <span className="badge" style={{ fontSize: 10, padding: "2px 7px" }}>
                            {TIPO_LABEL[a.tipo] ?? a.tipo}
                          </span>
                        )}
                        {a.projeto && (
                          <Link
                            href={`/dashboard/projetos/${a.projeto.id}`}
                            style={{
                              fontSize: 11, color: "var(--clr-primary)",
                              fontWeight: 500, textDecoration: "none",
                              display: "flex", alignItems: "center", gap: 4,
                            }}
                          >
                            {a.projeto.codigoSequencial && (
                              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                                {a.projeto.codigoSequencial}
                              </span>
                            )}
                            <span>{a.projeto.titulo}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
