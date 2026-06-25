import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { listClientesByEmpresa } from "@/data/cliente";
import { criarProjeto } from "@/actions/projeto";
import { PlusIcon } from "@/components/Icons";
import EnderecoFields from "@/components/EnderecoFields";

export const metadata: Metadata = { title: "Nova Oportunidade" };

const ORIGENS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "indicacao", label: "Indicação" },
  { value: "instagram", label: "Instagram" },
  { value: "site", label: "Site" },
  { value: "telefone", label: "Telefone" },
  { value: "cliente_antigo", label: "Cliente antigo" },
  { value: "prospeccao_ativa", label: "Prospecção ativa" },
  { value: "outro", label: "Outro" },
];

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

const STATUS_FUNIL_VALIDOS = ["novo", "fila_espera", "em_andamento", "proposta_enviada", "em_negociacao", "ganho", "perdido"];

export default async function NovaOportunidade({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; clienteId?: string; status?: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { stage: defaultStage, clienteId: preSelectedClienteId, status: statusParam } = await searchParams;
  const statusInicial = statusParam && STATUS_FUNIL_VALIDOS.includes(statusParam) ? statusParam : undefined;

  const clientes = await listClientesByEmpresa(empresaId, { take: 100 });
  const semClientes = clientes.length === 0;
  const isObra = defaultStage === "obra";

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
                  <select name="origem" className="form-input form-select" defaultValue="whatsapp">
                    <option value="">Não informada</option>
                    {ORIGENS.map((o) => (
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
                  <label className="form-label">Início estimado</label>
                  <input name="dataInicioEstimada" type="date" className="form-input" />
                </div>
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

              {/* Toggle entre existente e novo — CSS-only via radio */}
              <input
                type="radio"
                name="clienteMode"
                id="cm-existente"
                value="existente"
                className="cm-radio"
                defaultChecked={!semClientes}
              />
              <input
                type="radio"
                name="clienteMode"
                id="cm-novo"
                value="novo"
                className="cm-radio"
                defaultChecked={semClientes}
              />

              <div className="cm-tabs">
                <label htmlFor="cm-existente" className="cm-tab">Existente</label>
                <label htmlFor="cm-novo" className="cm-tab">Novo lead</label>
              </div>

              {/* Seção: cliente existente */}
              <div className="cm-section cm-section-existente">
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
                        defaultValue={preSelectedClienteId ?? ""}
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
                    <p style={{ fontSize: 12, color: "var(--clr-text-muted)" }}>
                      Lead novo? Use a aba Novo lead ao lado.
                    </p>
                  </>
                )}
              </div>

              {/* Seção: novo cliente inline */}
              <div className="cm-section cm-section-novo">
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
                  <select name="novoClienteOrigem" className="form-input form-select" defaultValue="whatsapp">
                    <option value="">Não informado</option>
                    {ORIGENS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    background: "var(--clr-info-bg)",
                    borderRadius: "var(--r-md)",
                    padding: "10px 12px",
                    fontSize: 12,
                    color: "var(--clr-info)",
                    lineHeight: 1.6,
                  }}
                >
                  O cliente será criado junto com a oportunidade. Dados completos (email, CPF, endereço) podem ser adicionados após o fechamento.
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
