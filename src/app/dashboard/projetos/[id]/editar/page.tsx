import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getProjetoByEmpresa } from "@/data/projeto";
import { listClientesByEmpresa } from "@/data/cliente";
import { editarProjeto, deletarProjeto, reverterParaOportunidade, trocarClienteProjeto } from "@/actions/projeto";
import { EditIcon } from "@/components/Icons";
import EnderecoFields from "@/components/EnderecoFields";

export const metadata: Metadata = { title: "Editar Projeto" };

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

function toDateInputValue(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export default async function EditarProjetoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { id } = await params;

  const projeto = await getProjetoByEmpresa(empresaId, id);
  if (!projeto) notFound();

  const clientes = await listClientesByEmpresa(empresaId);

  const isOportunidade = projeto.stage === "oportunidade";

  return (
    <div>
      <Link href={`/dashboard/projetos/${id}`} className="back-link">
        ← {projeto.titulo}
      </Link>

      <div className="form-card">
        <div className="form-card-title">Editar {isOportunidade ? "oportunidade" : "obra"}</div>
        <p className="form-card-sub">
          Altere os dados principais da {isOportunidade ? "oportunidade" : "obra"}.
        </p>

        <form action={editarProjeto}>
          <input type="hidden" name="projetoId" value={projeto.id} />

          <div className="form-group">
            <label className="form-label">Título *</label>
            <input
              name="titulo"
              type="text"
              className="form-input"
              defaultValue={projeto.titulo}
              required
              minLength={2}
              maxLength={200}
            />
          </div>

          <div className="form-row">
            {!isOportunidade && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Número da obra</label>
                <input
                  name="numeroObra"
                  type="text"
                  className="form-input"
                  defaultValue={projeto.numeroObra ?? ""}
                  maxLength={50}
                  placeholder="Ex: 001, A-12"
                />
              </div>
            )}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Início estimado</label>
              <input
                name="dataInicioEstimada"
                type="date"
                className="form-input"
                defaultValue={toDateInputValue(projeto.dataInicioEstimada)}
              />
            </div>
          </div>

          {isOportunidade && (
            <>
              <div className="form-row" style={{ marginTop: 18 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo de obra</label>
                  <select
                    name="tipoObra"
                    className="form-input form-select"
                    defaultValue={projeto.tipoObra ?? ""}
                  >
                    <option value="">Não informado</option>
                    {TIPOS_OBRA.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prioridade</label>
                  <select
                    name="prioridade"
                    className="form-input form-select"
                    defaultValue={projeto.prioridade ?? ""}
                  >
                    <option value="">Não definida</option>
                    {PRIORIDADES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: 18 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Metragem estimada (m²)</label>
                  <input
                    name="metragemEstimada"
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    defaultValue={projeto.metragemEstimada ? Number(projeto.metragemEstimada) : ""}
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
                    defaultValue={projeto.valorEstimado ? Number(projeto.valorEstimado) : ""}
                    placeholder="Ex: 250000"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 18 }}>
                <label className="form-label">Valor de ganho (estimativa) (R$)</label>
                <input
                  name="valorGanhoEstimativa"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  defaultValue={projeto.valorGanhoEstimativa ? Number(projeto.valorGanhoEstimativa) : ""}
                  placeholder="Ex: 300000"
                />
              </div>

              <EnderecoFields
                fieldNames={{ cep: "cepObra", logradouro: "logradouroObra", numero: "numeroEnderecoObra", complemento: "complementoObra", bairro: "bairroObra", cidade: "cidadeObra", estado: "estadoObra" }}
                defaults={{ cep: projeto.cepObra ?? "", logradouro: projeto.logradouroObra ?? "", numero: projeto.numeroEnderecoObra ?? "", complemento: projeto.complementoObra ?? "", bairro: projeto.bairroObra ?? "", cidade: projeto.cidadeObra ?? "", estado: projeto.estadoObra ?? "" }}
                logradouroLabel="Logradouro da obra"
                marginTop={18}
              />

              <div className="form-group" style={{ marginTop: 18 }}>
                <label className="form-label">Data de ganho da oportunidade</label>
                <input
                  name="dataDeGanho"
                  type="date"
                  className="form-input"
                  defaultValue={toDateInputValue(projeto.dataDeGanho)}
                />
              </div>
            </>
          )}

          <div className="form-group" style={{ marginTop: 18 }}>
            <label className="form-label">Origem do contato</label>
            <input
              name="origem"
              type="text"
              className="form-input"
              defaultValue={projeto.origem ?? ""}
              placeholder="Ex: Indicação, Instagram, WhatsApp"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descrição / Briefing</label>
            <textarea
              name="descricao"
              className="form-input form-textarea"
              defaultValue={projeto.descricao ?? ""}
              placeholder="Descreva o escopo, localização ou observações importantes..."
              maxLength={2000}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <EditIcon size={15} />
              Salvar alterações
            </button>
            <Link href={`/dashboard/projetos/${id}`} className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      <div className="form-card" style={{ marginTop: 24 }}>
        <div className="form-card-title">Cliente vinculado</div>
        <form action={trocarClienteProjeto} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <input type="hidden" name="projetoId" value={projeto.id} />
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Selecionar cliente</label>
            <select name="clienteId" className="form-input form-select" required defaultValue={projeto.cliente?.id ?? ""}>
              <option value="" disabled>Selecione o cliente correto...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary">Atualizar cliente</button>
        </form>
      </div>

      {!isOportunidade && (
        <div className="form-card" style={{ marginTop: 24, border: "1px solid #fde68a", background: "#fffbeb" }}>
          <div className="form-card-title" style={{ color: "#92400e" }}>⚠ Reverter para Oportunidade</div>
          <p className="form-card-sub" style={{ color: "#78350f" }}>
            Use apenas se a conversão foi feita por engano. O projeto voltará para o funil de oportunidades com status <strong>Ganho</strong>.
            Todas as tarefas, lançamentos e histórico serão preservados.
          </p>
          <form action={reverterParaOportunidade} style={{ marginTop: 14 }}>
            <input type="hidden" name="projetoId" value={projeto.id} />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ color: "#92400e", borderColor: "#fcd34d" }}>
              Reverter para Oportunidade
            </button>
          </form>
        </div>
      )}

      <div className="form-card" style={{ marginTop: 24, border: "1px solid #fca5a5", background: "#fef2f2" }}>
        <div className="form-card-title" style={{ color: "#991b1b" }}>Zona de Perigo</div>
        <details>
          <summary style={{ fontSize: 13, color: "#b91c1c", cursor: "pointer", listStyle: "none", padding: "2px 0", fontWeight: 600 }}>
            Arquivar est{isOportunidade ? "a oportunidade" : "a obra"}
          </summary>
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 14, lineHeight: 1.6 }}>
              Esta ação remove o item das listagens operacionais e preserva a trilha de auditoria.
            </p>
            <form action={deletarProjeto}>
              <input type="hidden" name="projetoId" value={projeto.id} />
              <button type="submit" style={{ background: "#dc2626", color: "white", border: "none", borderRadius: "var(--r-sm)", padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                Arquivar e voltar para a lista
              </button>
            </form>
          </div>
        </details>
      </div>
    </div>
  );
}
