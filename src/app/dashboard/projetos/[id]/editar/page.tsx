import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getProjetoByEmpresa } from "@/data/projeto";
import { editarProjeto } from "@/actions/projeto";
import { EditIcon } from "@/components/Icons";
import EnderecoAutocomplete from "@/components/EnderecoAutocomplete";

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

  const isOportunidade = projeto.stage === "oportunidade";

  return (
    <div>
      <Link href={`/dashboard/projetos/${id}`} className="back-link">
        ← {projeto.titulo}
      </Link>

      <div className="form-card">
        <div className="form-card-title">Editar {isOportunidade ? "oportunidade" : "obra"}</div>
        <p className="form-card-sub">
          Altere os dados principais. Cliente não pode ser alterado aqui.
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

              <div className="form-group" style={{ marginTop: 18 }}>
                <label className="form-label">Endereço da obra</label>
                <EnderecoAutocomplete
                  name="enderecoObra"
                  defaultValue={projeto.enderecoObra ?? ""}
                  className="form-input"
                  placeholder="Rua, número, bairro, cidade"
                  maxLength={300}
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
    </div>
  );
}
