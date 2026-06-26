import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listClientesByEmpresa } from "@/data/cliente";
import { criarProjeto } from "@/actions/projeto";
import { preencherOportunidadeComAgente } from "@/actions/ai/preencherOportunidade";
import { PlusIcon } from "@/components/Icons";
import EnderecoFields from "@/components/EnderecoFields";
import CapturaOperacionalPanel from "@/components/CapturaOperacionalPanel";
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
  searchParams: Promise<{
    stage?: string; clienteId?: string; status?: string;
    agenteFilled?: string; erro?: string;
    titulo?: string; descricao?: string; tipoObra?: string; origem?: string;
    prioridade?: string; statusInicial?: string; dataInicio?: string;
    metragem?: string; valor?: string; valorGanho?: string;
    cep?: string; logradouro?: string; numeroEndereco?: string; complemento?: string;
    bairro?: string; cidade?: string; estado?: string;
    clienteNome?: string; clienteTel?: string; pendencias?: string;
    tarefas?: string; semDestino?: string;
  }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const {
    stage: defaultStage, clienteId: preSelectedClienteId, status: statusParam,
    agenteFilled, erro,
    titulo: aTitulo, descricao: aDescricao, tipoObra: aTipoObra, origem: aOrigem,
    prioridade: aPrioridade, statusInicial: aStatusInicial, dataInicio: aDataInicio,
    metragem: aMetragem, valor: aValor, valorGanho: aValorGanho,
    cep: aCep, logradouro: aLogradouro, numeroEndereco: aNumeroEndereco,
    complemento: aComplemento, bairro: aBairro, cidade: aCidade, estado: aEstado,
    clienteNome: aClienteNome, clienteTel: aClienteTel, pendencias: aPendencias,
    tarefas: aTarefas, semDestino: aSemDestino,
  } = await searchParams;

  const isObra = defaultStage === "obra";
  const statusValidos = isObra ? STATUS_OBRA_VALIDOS : STATUS_FUNIL_VALIDOS;
  const statusSugerido = statusParam ?? aStatusInicial;
  const statusInicial = statusSugerido && statusValidos.includes(statusSugerido) ? statusSugerido : undefined;
  const statusMap = isObra ? STATUS_OBRA : STATUS_OPORTUNIDADE;

  const clientes = await listClientesByEmpresa(empresaId, { take: 100 });
  const semClientes = clientes.length === 0;

  const tiposObraValidos: string[] = TIPOS_OBRA.map((t) => t.value);
  const origensValidas: string[] = ORIGENS_LEAD.map((o) => o.value);
  const prioridadesValidas: string[] = PRIORIDADES.map((p) => p.value);

  // Sanitize agent values against allowed enums
  const defaultTipoObra = aTipoObra && tiposObraValidos.includes(aTipoObra) ? aTipoObra : "";
  const defaultOrigem   = aOrigem   && origensValidas.includes(aOrigem)     ? aOrigem   : (agenteFilled ? "" : "indicacao");
  const defaultPrioridade = aPrioridade && prioridadesValidas.includes(aPrioridade) ? aPrioridade : (agenteFilled ? "" : "media");
  const defaultDataInicio = aDataInicio && /^\d{4}-\d{2}-\d{2}$/.test(aDataInicio) ? aDataInicio : "";
  const enderecoDefaults = {
    cep: aCep ?? "",
    logradouro: aLogradouro ?? "",
    numero: aNumeroEndereco ?? "",
    complemento: aComplemento ?? "",
    bairro: aBairro ?? "",
    cidade: aCidade ?? "",
    estado: aEstado ?? "",
  };

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

      {/* ── Painel de Captura Operacional ── */}
      {!isObra && (
        <CapturaOperacionalPanel
          action={preencherOportunidadeComAgente}
          extraFields={{ stage: defaultStage ?? "oportunidade" }}
          agenteFilled={agenteFilled}
          erro={erro}
          pendencias={aPendencias}
          tarefas={aTarefas}
          semDestino={aSemDestino}
        />
      )}

      {/* ── Formulário principal ── */}
      <form action={criarProjeto}>
        <input type="hidden" name="stage" value={defaultStage ?? "oportunidade"} />
        {statusInicial && <input type="hidden" name="statusInicial" value={statusInicial} />}
        {agenteFilled === "1" && aTarefas && (
          <input type="hidden" name="tarefasSugeridas" value={aTarefas} />
        )}
        {agenteFilled === "1" && aPendencias && (
          <input type="hidden" name="pendenciasAgente" value={aPendencias} />
        )}

        {/* Nota de cliente detectado pelo agente */}
        {aClienteNome && (
          <div style={{
            background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "var(--r-md)",
            padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#92400e",
          }}>
            Cliente detectado pelo agente: <strong>{aClienteNome}</strong>
            {aClienteTel ? ` — ${aClienteTel}` : ""}
            {" "}— busque ou crie manualmente no painel ao lado.
          </div>
        )}

        <div className="novo-op-layout">
          {/* ── Coluna principal ── */}
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
                  defaultValue={aTitulo ?? ""}
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
                  defaultValue={aDescricao ?? ""}
                  maxLength={2000}
                  rows={4}
                />
                <span className="form-hint">Registre o contexto da conversa inicial. Pode ser incompleto por enquanto.</span>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Origem do lead</label>
                  <select name="origem" className="form-input form-select" defaultValue={defaultOrigem}>
                    <option value="">Não informada</option>
                    {ORIGENS_LEAD.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo de obra</label>
                  <select name="tipoObra" className="form-input form-select" defaultValue={defaultTipoObra}>
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
                  <select name="prioridade" className="form-input form-select" defaultValue={defaultPrioridade}>
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
                <input name="dataInicioEstimada" type="date" className="form-input" defaultValue={defaultDataInicio} />
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
                    defaultValue={aMetragem ?? ""}
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
                    defaultValue={aValor ?? ""}
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
                  defaultValue={aValorGanho ?? ""}
                />
                <span className="form-hint">Valor esperado ao fechar o contrato.</span>
              </div>

              <EnderecoFields
                fieldNames={{ cep: "cepObra", logradouro: "logradouroObra", numero: "numeroEnderecoObra", complemento: "complementoObra", bairro: "bairroObra", cidade: "cidadeObra", estado: "estadoObra" }}
                defaults={enderecoDefaults}
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
                defaultMode={aClienteNome && !preSelectedClienteId ? "novo" : undefined}
                defaultNovoClienteNome={aClienteNome}
                defaultNovoClienteTelefone={aClienteTel}
                defaultNovoClienteOrigem={defaultOrigem}
                semClientes={semClientes}
                origens={ORIGENS_LEAD}
                novoClienteHref={`/dashboard/clientes/novo?redirectTo=${encodeURIComponent(
                  `/dashboard/projetos/novo${defaultStage ? `?stage=${defaultStage}` : ""}`
                )}`}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
