"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import {
  adicionarDocumentoOtto,
  aprovarEAPEPopularOrcamento,
  gerarEAPOtto,
  iniciarOttoSessao,
  processarLeituraTecnicaOtto,
  removerDocumentoOtto,
  responderDecisaoOttoAction,
  toggleAprovarItemEAP,
} from "@/actions/otto"

export type SessaoOtto = {
  id: string
  projetoId: string
  estado: string
  leituraTecnica: string | null
  documentos: Array<{
    id: string
    tipo: string
    titulo: string
    conteudo: string | null
    url: string | null
  }>
  decisoes: Array<{
    id: string
    pergunta: string
    resposta: string | null
    impacto: string | null
    status: string
    posicao: number
  }>
  itensEAP: Array<{
    id: string
    parentId: string | null
    posicao: number
    nivelEAP: number
    nome: string
    descricao: string | null
    unidade: string | null
    quantidade: number | null
    statusEscopo: string | null
    natureza: string | null
    confianca: string | null
    fonte: string | null
    aprovado: boolean
    exportado: boolean
  }>
}

type Props = {
  projetoId: string
  sessao: SessaoOtto | null
}

const confiancaStyle: Record<string, React.CSSProperties> = {
  alta: { background: "var(--clr-success-bg)", color: "var(--clr-success)" },
  media: { background: "var(--clr-warning-bg)", color: "var(--clr-warning)" },
  baixa: { background: "var(--clr-danger-bg)", color: "var(--clr-danger)" },
}

const naturezaLabel: Record<string, string> = {
  servico_proprio: "Serv. proprio",
  material: "Material",
  equipamento: "Equipamento",
  terceiro: "Terceiro",
  taxa: "Taxa",
  logistica: "Logistica",
}

function sanitize(text: string) {
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/##/g, "").replace(/---/g, "").replace(/_/g, "").trim()
}

function parseLeitura(leituraTecnica: string | null) {
  if (!leituraTecnica) return { resumo: "", achados: [] as string[], lacunas: [] as string[] }
  try {
    const parsed = JSON.parse(leituraTecnica) as { resumo?: string; achados?: string[]; lacunas?: string[] }
    return {
      resumo: sanitize(parsed.resumo ?? ""),
      achados: (parsed.achados ?? []).map(sanitize),
      lacunas: (parsed.lacunas ?? []).map(sanitize),
    }
  } catch {
    return { resumo: sanitize(leituraTecnica), achados: [] as string[], lacunas: [] as string[] }
  }
}

function SubmitForm({
  action,
  children,
  style,
}: {
  action: (fd: FormData) => Promise<void>
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await action(fd)
    })
  }

  return (
    <form onSubmit={handleSubmit} style={style} aria-busy={pending}>
      <fieldset disabled={pending} style={{ all: "unset", display: "contents" }}>
        {children}
      </fieldset>
    </form>
  )
}

function Badge({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0,
        borderRadius: "var(--r-full)",
        padding: "2px 8px",
        background: "var(--clr-surface-hover)",
        color: "var(--clr-text-muted)",
        border: "1px solid var(--clr-border)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function LoadingStep({ text }: { text: string }) {
  return (
    <div style={{ padding: "18px 0", display: "flex", alignItems: "center", gap: 10, color: "var(--clr-text-secondary)", fontSize: 13 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "var(--clr-primary)",
          boxShadow: "0 0 0 5px var(--clr-primary-light)",
        }}
      />
      {text}
    </div>
  )
}

function EAPToggle({ item, projetoId }: { item: SessaoOtto["itensEAP"][0]; projetoId: string }) {
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const form = e.currentTarget.form
    if (!form) return
    const fd = new FormData(form)
    startTransition(async () => {
      await toggleAprovarItemEAP(fd)
    })
  }

  return (
    <form style={{ display: "contents" }}>
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="projetoId" value={projetoId} />
      <input type="hidden" name="aprovado" value={String(item.aprovado)} />
      <input
        type="checkbox"
        checked={item.aprovado}
        onChange={handleChange}
        disabled={pending || item.exportado}
        title={item.aprovado ? "Remover aprovacao" : "Aprovar item"}
        style={{ width: 15, height: 15, flexShrink: 0 }}
      />
    </form>
  )
}

function StepHeader({ current }: { current: number }) {
  const steps = ["Documentos", "Leitura", "Escopo", "EAP", "Concluido"]
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6, marginBottom: 16 }}>
      {steps.map((s, idx) => {
        const active = idx + 1 === current
        const done = idx + 1 < current
        return (
          <div
            key={s}
            style={{
              border: "1px solid",
              borderColor: active || done ? "var(--clr-primary)" : "var(--clr-border)",
              background: active ? "var(--clr-primary-light)" : done ? "var(--clr-success-bg)" : "var(--clr-surface)",
              color: active ? "var(--clr-primary)" : done ? "var(--clr-success)" : "var(--clr-text-muted)",
              borderRadius: "var(--r-sm)",
              padding: "7px 8px",
              fontSize: 11,
              fontWeight: 700,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {idx + 1}. {s}
          </div>
        )
      })}
    </div>
  )
}

export function OttoPanel({ projetoId, sessao }: Props) {
  const router = useRouter()
  const [tipoDoc, setTipoDoc] = useState("texto")
  const leitura = useMemo(() => parseLeitura(sessao?.leituraTecnica ?? null), [sessao?.leituraTecnica])

  useEffect(() => {
    if (!sessao || (sessao.estado !== "leitura_tecnica" && sessao.estado !== "eap_em_elaboracao")) return
    const timer = window.setInterval(() => router.refresh(), 3000)
    return () => window.clearInterval(timer)
  }, [router, sessao])

  if (!sessao) {
    return (
      <div style={{ border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: 16, marginBottom: 16, background: "var(--clr-surface)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>Otto Orçamentista</div>
            <div style={{ fontSize: 12, color: "var(--clr-text-secondary)" }}>Crie uma sessao para organizar documentos, escopo e EAP antes dos custos.</div>
          </div>
          <SubmitForm action={iniciarOttoSessao}>
            <input type="hidden" name="projetoId" value={projetoId} />
            <button type="submit" className="btn btn-primary btn-sm">Iniciar Otto</button>
          </SubmitForm>
        </div>
      </div>
    )
  }

  const currentStep =
    sessao.estado === "aprovado" ? 5 :
    sessao.estado === "eap_em_elaboracao" || sessao.estado === "aguardando_hitl_eap" ? 4 :
    sessao.estado === "aguardando_hitl_escopo" || sessao.estado === "escopo_validado" ? 3 :
    sessao.estado === "leitura_tecnica" ? 2 :
    1
  const pendentes = sessao.decisoes.filter((d) => d.status === "pendente")
  const respondidas = sessao.decisoes.filter((d) => d.status === "respondida")
  const roots = sessao.itensEAP.filter((i) => !i.parentId)
  const byParent = (id: string) => sessao.itensEAP.filter((i) => i.parentId === id).sort((a, b) => a.posicao - b.posicao)

  return (
    <div style={{ border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: 16, marginBottom: 16, background: "var(--clr-surface)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>Otto Orçamentista</div>
          <div style={{ fontSize: 12, color: "var(--clr-text-secondary)" }}>Documentos, leitura tecnica, HITL e EAP aprovada para o orçamento.</div>
        </div>
        <Badge>{sessao.estado.replaceAll("_", " ")}</Badge>
      </div>

      <StepHeader current={currentStep} />

      {(sessao.estado === "rascunho" || sessao.estado === "ingestao") && (
        <div>
          {sessao.documentos.length > 0 && (
            <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              {sessao.documentos.map((doc) => (
                <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--clr-border-light)" }}>
                  <Badge>{doc.tipo}</Badge>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--clr-text)" }}>{doc.titulo}</span>
                  <SubmitForm action={removerDocumentoOtto}>
                    <input type="hidden" name="id" value={doc.id} />
                    <input type="hidden" name="projetoId" value={projetoId} />
                    <button type="submit" className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>Remover</button>
                  </SubmitForm>
                </div>
              ))}
            </div>
          )}

          <SubmitForm action={adicionarDocumentoOtto} style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            <input type="hidden" name="sessaoId" value={sessao.id} />
            <input type="hidden" name="projetoId" value={projetoId} />
            <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--clr-text-secondary)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <input type="radio" name="tipo" value="texto" checked={tipoDoc === "texto"} onChange={() => setTipoDoc("texto")} />
                Texto
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <input type="radio" name="tipo" value="url" checked={tipoDoc === "url"} onChange={() => setTipoDoc("url")} />
                URL
              </label>
            </div>
            <input name="titulo" className="form-input" placeholder="Titulo do documento" required maxLength={300} />
            {tipoDoc === "texto" ? (
              <textarea name="conteudo" className="form-input" placeholder="Cole memorial, briefing, lista de ambientes ou notas tecnicas" required rows={5} style={{ resize: "vertical" }} />
            ) : (
              <input name="url" type="url" className="form-input" placeholder="https://..." required />
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-secondary btn-sm">Adicionar documento</button>
            </div>
          </SubmitForm>

          <SubmitForm action={processarLeituraTecnicaOtto}>
            <input type="hidden" name="sessaoId" value={sessao.id} />
            <input type="hidden" name="projetoId" value={projetoId} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={sessao.documentos.length === 0}>Analisar documentos</button>
          </SubmitForm>
        </div>
      )}

      {sessao.estado === "leitura_tecnica" && <LoadingStep text="Otto esta analisando os documentos..." />}

      {(sessao.estado === "aguardando_hitl_escopo" || sessao.estado === "escopo_validado") && (
        <div style={{ display: "grid", gap: 14 }}>
          {leitura.resumo && <p style={{ margin: 0, fontSize: 13, color: "var(--clr-text-secondary)", lineHeight: 1.7 }}>{leitura.resumo}</p>}
          {leitura.lacunas.length > 0 && (
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--clr-text-muted)" }}>Lacunas</div>
              {leitura.lacunas.map((l, idx) => <div key={idx} style={{ fontSize: 12, color: "var(--clr-text-secondary)" }}>{l}</div>)}
            </div>
          )}

          {pendentes.map((decisao) => (
            <SubmitForm key={decisao.id} action={responderDecisaoOttoAction} style={{ display: "grid", gap: 8, padding: "10px 0", borderTop: "1px solid var(--clr-border-light)" }}>
              <input type="hidden" name="id" value={decisao.id} />
              <input type="hidden" name="sessaoId" value={sessao.id} />
              <input type="hidden" name="projetoId" value={projetoId} />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--clr-text)" }}>{decisao.pergunta}</span>
                {decisao.impacto && <Badge>{decisao.impacto}</Badge>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input name="resposta" className="form-input" placeholder="Resposta do responsavel" required style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary btn-sm">Responder</button>
              </div>
            </SubmitForm>
          ))}

          {respondidas.map((decisao) => (
            <div key={decisao.id} style={{ padding: "8px 0", borderTop: "1px solid var(--clr-border-light)", fontSize: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                <span style={{ flex: 1, fontWeight: 600, color: "var(--clr-text)" }}>{decisao.pergunta}</span>
                <Badge style={{ background: "var(--clr-success-bg)", color: "var(--clr-success)" }}>Respondida</Badge>
              </div>
              <div style={{ color: "var(--clr-text-secondary)" }}>{decisao.resposta}</div>
            </div>
          ))}

          {pendentes.length === 0 && (
            <SubmitForm action={gerarEAPOtto}>
              <input type="hidden" name="sessaoId" value={sessao.id} />
              <input type="hidden" name="projetoId" value={projetoId} />
              <button type="submit" className="btn btn-primary btn-sm">Gerar Estrutura do Projeto</button>
            </SubmitForm>
          )}
        </div>
      )}

      {sessao.estado === "eap_em_elaboracao" && <LoadingStep text="Otto esta gerando a estrutura do projeto..." />}

      {sessao.estado === "aguardando_hitl_eap" && (
        <div style={{ display: "grid", gap: 10 }}>
          {sessao.itensEAP.length === 0 ? (
            <div className="placeholder-block">Nenhum item EAP foi gerado. Revise documentos e gere novamente.</div>
          ) : (
            roots.map((root) => (
              <div key={root.id} style={{ borderTop: "1px solid var(--clr-border-light)", paddingTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <EAPToggle item={root} projetoId={projetoId} />
                  <strong style={{ fontSize: 13, color: "var(--clr-text)", flex: 1 }}>{root.nome}</strong>
                  {root.confianca && <Badge style={confiancaStyle[root.confianca]}>Conf. {root.confianca}</Badge>}
                </div>
                {byParent(root.id).map((child) => (
                  <div key={child.id} style={{ marginLeft: 23, display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: "1px solid var(--clr-border-light)" }}>
                    <EAPToggle item={child} projetoId={projetoId} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--clr-text-secondary)" }}>{child.nome}</span>
                    {child.natureza && <Badge>{naturezaLabel[child.natureza] ?? child.natureza}</Badge>}
                    {child.confianca && <Badge style={confiancaStyle[child.confianca]}>Conf. {child.confianca}</Badge>}
                    {(child.unidade || child.quantidade != null) && (
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--clr-text-muted)", minWidth: 70, textAlign: "right" }}>
                        {child.quantidade != null ? child.quantidade.toLocaleString("pt-BR") : "—"} {child.unidade ?? ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
          <SubmitForm action={aprovarEAPEPopularOrcamento} style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <input type="hidden" name="sessaoId" value={sessao.id} />
            <input type="hidden" name="projetoId" value={projetoId} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!sessao.itensEAP.some((i) => i.aprovado && !i.exportado)}>
              Importar EAP aprovada
            </button>
          </SubmitForm>
        </div>
      )}

      {sessao.estado === "aprovado" && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", paddingTop: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--clr-success)", marginBottom: 3 }}>EAP importada com sucesso para o Orçamento.</div>
            <div style={{ fontSize: 12, color: "var(--clr-text-secondary)" }}>Os custos seguem para preenchimento manual nos itens importados.</div>
          </div>
          <a href="#tab-orcamento" className="btn btn-secondary btn-sm">Ver orçamento</a>
        </div>
      )}
    </div>
  )
}
