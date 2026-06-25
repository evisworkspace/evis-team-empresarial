import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listClientesByEmpresa } from "@/data/cliente";
import { criarProjeto } from "@/actions/projeto";
import { PlusIcon } from "@/components/Icons";
import EnderecoFields from "@/components/EnderecoFields";
import { STATUS_OPORTUNIDADE, STATUS_OBRA } from "@/lib/status";
import { ORIGENS_LEAD } from "@/lib/origens";
import ClienteSelectorPanel from "@/components/ClienteSelectorPanel";

export const metadata: Metadata = { title: "Nova Oportunidade" };

const TIPOS_OBRA = [
  { value: "residencial", label: "Residencial" },
  { value: "comercial", label: "Comercial" },
  { value: "industrial", label: "Industrial" },
  { value: "reforma", label: "Reforma" },
  { value: "outro", label: "Outro" },
];

const PRIORIDADES = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const STATUS_FUNIL_VALIDOS = Object.keys(STATUS_OPORTUNIDADE);
const STATUS_OBRA_VALIDOS  = Object.keys(STATUS_OBRA);

export default async function NovaOportunidade({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; clienteId?: string; status?: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { stage: defaultStage, clienteId: preSelectedClienteId, status: statusParam } = await searchParams;
  const isObra = defaultStage === "obra";
  const statusValidos = isObra ? STATUS_OBRA_VALIDOS : STATUS_FUNIL_VALIDOS;
  const statusInicial = statusParam && statusValidos.includes(statusParam) ? statusParam : undefined;
  const statusMap = isObra ? STATUS_OBRA : STATUS_OPORTUNIDADE;

  const clientes = await listClientesByEmpresa(empresaId, { take: 100 });
  const semClientes = clientes.length === 0;

  return (
    <div>
      <Link
        href={isObra ? "/dashboard/projetos?stage=obra" : "/dashboard/projetos?stage=oportunidade"}
        className="back-link"
      >
        ← {isObra ? "Obras" : "Oportunidades"}
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>
          {isObra ? "Nova obra" : "Nova oportunidade"}
        </h1>
        <p style={{ fontSize: 14, color: "var(--clr-text-muted)" }}>
          {isObra
            ? "Registre uma obra já contratada."
            : "Registre um novo lead ou oportunidade comercial. O cliente pode ser criado aqui mesmo."}
        </p>
      </div>

      <form action={criarProjeto}>
        <input type="hidden" name="stage" value={defaultStage ?? "oportunidade"} />
        {statusInicial && <input type="hidden" name="statusInicial" value={statusInicial} />}

        <div className="novo-op-layout">
          {/* ── Coluna principal: dados da oportunidade ── */}
          <div className="novo-op-main">
            <div className="form-card" style={{ marginBottom: 0 }}>
              <div className="form-card-title">Dados da {isObra ? "obra" : "oportunidade"}</div>

              <div className="form-group">
                <label className="form-label">Título *</label>
                <input
                  name="titulo"
                  type="text"
                  className="form-input"
                  placeholder={isObra ? "Ex: Residência Silva — Construção" : "Ex: Reforma Apartamento Pedro"}
                  required
                  minLength={2}
                  maxLength={200}
                />
                <span className="form-hint">Nome que identifica esta {isObra ? "obra" : "oportunidade"} no sistema.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Narrativa inicial</label>
                <textarea
                  name="descricao"
                  className="form-input form-textarea"
                  placeholder="Descreva o que o cliente pediu — mensagem recebida, áudio transcrito, escopo, localização..."
                  maxLength={2000}
                  rows={4}
                />
                <span className="form-hint">Registre o contexto da conversa inicial. Pode ser incompleto por enquanto.</span>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Origem do lead</label>
                  <select name="origem" className="form-input form-select" defaultValue="indicacao">
                    <option value="">Não informada</option>
                    {ORIGENS_LEAD.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo de obra</label>
                  <select name="tipoObra" className="form-input form-select" defaultValue="">
                    <option value="">Não informado</option>
                    {TIPOS_OBRA.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prioridade</label>
                  <select name="prioridade" className="form-input form-select" defaultValue="media">
                    <option value="">Não definida</option>
                    {PRIORIDADES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status inicial</label>
                  <select name="statusInicial" className="form-input form-select" defaultValue={statusInicial ?? Object.keys(statusMap)[0]}>
                    {Object.entries(statusMap).map(([slug, cfg]) => (
                      <option key={slug} value={slug}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Início estimado</label>
                <input name="dataInicioEstimada" type="date" className="form-input" />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Metragem estimada (m²)</label>
                  <input
                    name="metragemEstimada"
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    placeholder="Ex: 120"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Valor estimado (R$)</label>
                  <input
                    name="valorEstimado"
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    placeholder="Ex: 250000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Valor de ganho (estimativa) (R$)</label>
                <input
                  name="valorGanhoEstimativa"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="Ex: 300000"
                />
                <span className="form-hint">Valor esperado ao fechar o contrato.</span>
              </div>

              <EnderecoFields
                fieldNames={{ cep: "cepObra", logradouro: "logradouroObra", numero: "numeroEnderecoObra", complemento: "complementoObra", bairro: "bairroObra", cidade: "cidadeObra", estado: "estadoObra" }}
                logradouroLabel="Logradouro da obra"
                marginTop={0}
              />

              {isObra && (
                <div className="form-group">
                  <label className="form-label">Número da obra</label>
                  <input
                    name="numeroObra"
                    type="text"
                    className="form-input"
                    placeholder="Ex: 001, A-12"
                    maxLength={50}
                  />
                  <span className="form-hint">Opcional — pode ser adicionado depois.</span>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: 24, paddingTop: 0, borderTop: "none" }}>
                <button type="submit" className="btn btn-primary">
                  <PlusIcon size={15} />
                  Criar {isObra ? "obra" : "oportunidade"}
                </button>
                <Link
                  href={isObra ? "/dashboard/projetos?stage=obra" : "/dashboard/projetos?stage=oportunidade"}
                  className="btn btn-secondary"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>

          {/* ── Painel lateral: cliente / lead ── */}
          <div className="novo-op-client-panel">
            <div className="form-card" style={{ marginBottom: 0 }}>
              <div className="form-card-title">Cliente / Lead</div>
              <ClienteSelectorPanel
                clientes={clientes}
                defaultClienteId={preSelectedClienteId}
                semClientes={semClientes}
                origens={ORIGENS_LEAD}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
