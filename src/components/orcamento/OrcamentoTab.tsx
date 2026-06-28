"use client"
import { useState, useTransition, useEffect } from "react"
import { SugestaoCard } from "@/components/triagem/SugestaoCard"
import { sugerirTarefasOrcamento, criarTarefasSugeridas } from "@/actions/tarefa"
import { OttoPanel, type SessaoOtto } from "@/components/orcamento/OttoPanel"

type Item = {
  id: string
  tipo: string
  nome: string
  grupo: string | null
  parentId: string | null
  posicao: number
  unidade: string | null
  quantidade: number | null
  custoServicos: number | null
  bdi: number | null
  produtos: number | null
  servicos: number | null
  statusItem: string | null
  itemBiblioteca: { id: string; nome: string; codigo: string | null } | null
}

type BibItem = { id: string; nome: string; codigo: string | null }

type Actions = {
  criarGrupo: (fd: FormData) => Promise<void>
  criarItem: (fd: FormData) => Promise<void>
  editarItem: (fd: FormData) => Promise<void>
  excluirItem: (fd: FormData) => Promise<void>
}

type Props = {
  items: Item[]
  projetoId: string
  bibliotecaItens: BibItem[]
  actions: Actions
  sessaoOtto?: SessaoOtto | null
}

function fmt(v: number | null): string {
  if (v == null) return "—"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function calcServicos(cs: number, bdi: number, prod: number): number {
  return (cs + prod) * (1 + bdi / 100)
}

const statusItemLabel: Record<string, string> = {
  para_aprovar: "Para aprovar",
  aprovado: "Aprovado",
  nao_aprovado: "Nao aprovado",
}

const statusItemClass: Record<string, string> = {
  para_aprovar: "badge-previsto",
  aprovado: "badge-fechado",
  nao_aprovado: "badge-perdido",
}

// ─── ComposicaoRow ────────────────────────────────────────────────────────────

function ComposicaoRow({
  item,
  num,
  onEdit,
  onExcluir,
  pending,
}: {
  item: Item
  num: string
  onEdit: () => void
  onExcluir: () => void
  pending: boolean
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32px 1fr 70px 50px 80px 60px 70px 80px 86px 30px 30px",
        gap: 4,
        alignItems: "center",
        padding: "5px 8px",
        borderBottom: "1px solid var(--clr-border-light)",
        fontSize: 12,
        color: "var(--clr-text)",
      }}
    >
      <span style={{ color: "var(--clr-text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{num}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.nome}>
        {item.nome}
      </span>
      <span style={{ color: "var(--clr-text-muted)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" }}>{item.grupo ?? "—"}</span>
      <span style={{ color: "var(--clr-text-muted)", fontSize: 11 }}>{item.unidade ?? "—"}</span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
        {item.quantidade != null ? item.quantidade.toLocaleString("pt-BR") : "—"}
      </span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
        {item.bdi != null ? `${item.bdi}%` : "—"}
      </span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmt(item.custoServicos)}</span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--clr-success)" }}>
        {fmt(item.servicos)}
      </span>
      <span>
        {item.statusItem && (
          <span className={`badge ${statusItemClass[item.statusItem] ?? "badge-previsto"}`} style={{ fontSize: 10, whiteSpace: "nowrap" }}>
            {statusItemLabel[item.statusItem] ?? item.statusItem}
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={onEdit}
        disabled={pending}
        title="Editar"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clr-primary)", padding: "2px 4px", fontSize: 12 }}
      >
        ✎
      </button>
      <button
        type="button"
        onClick={onExcluir}
        disabled={pending}
        title="Excluir"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clr-text-muted)", padding: "2px 4px", fontSize: 14, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  )
}

// ─── ComposicaoForm (add/edit) ────────────────────────────────────────────────

function ComposicaoForm({
  projetoId,
  parentId,
  bibliotecaItens,
  actions,
  onClose,
  editItem,
}: {
  projetoId: string
  parentId: string
  bibliotecaItens: BibItem[]
  actions: Actions
  onClose: () => void
  editItem?: Item
}) {
  const [pending, startTransition] = useTransition()
  const [cs, setCS] = useState(editItem?.custoServicos?.toString() ?? "")
  const [bdi, setBDI] = useState(editItem?.bdi?.toString() ?? "120")
  const [prod, setProd] = useState(editItem?.produtos?.toString() ?? "")

  const preview = (() => {
    const c = parseFloat(cs) || 0
    const b = parseFloat(bdi) || 0
    const p = parseFloat(prod) || 0
    if (!b && !c) return null
    return calcServicos(c, b, p)
  })()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      if (editItem) {
        await actions.editarItem(fd)
      } else {
        await actions.criarItem(fd)
      }
      onClose()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: "8px 10px",
        background: "var(--clr-surface)",
        borderRadius: "var(--r-sm)",
        border: "1px solid var(--clr-border)",
        marginTop: 4,
        marginLeft: editItem ? 0 : 8,
      }}
    >
      <input type="hidden" name="projetoId" value={projetoId} />
      <input type="hidden" name="parentId" value={parentId} />
      {editItem && <input type="hidden" name="id" value={editItem.id} />}

      <input
        name="nome"
        className="form-input"
        placeholder="Nome do item"
        required
        defaultValue={editItem?.nome ?? ""}
        style={{ flex: "3 1 160px", minWidth: 0 }}
      />
      <input
        name="grupo"
        className="form-input"
        placeholder="Grupo/cômodo"
        defaultValue={editItem?.grupo ?? ""}
        style={{ flex: "1 1 80px", minWidth: 0 }}
      />
      <input
        name="unidade"
        className="form-input"
        placeholder="Un"
        defaultValue={editItem?.unidade ?? ""}
        style={{ width: 52, flexShrink: 0 }}
      />
      <input
        name="quantidade"
        type="number"
        step="0.0001"
        min="0"
        className="form-input"
        placeholder="Qtd"
        defaultValue={editItem?.quantidade?.toString() ?? ""}
        style={{ width: 72, flexShrink: 0 }}
      />
      <input
        name="custoServicos"
        type="number"
        step="0.01"
        min="0"
        className="form-input"
        placeholder="Custo serv."
        value={cs}
        onChange={(e) => setCS(e.target.value)}
        style={{ width: 90, flexShrink: 0 }}
      />
      <input
        name="bdi"
        type="number"
        step="0.01"
        min="0"
        className="form-input"
        placeholder="BDI %"
        value={bdi}
        onChange={(e) => setBDI(e.target.value)}
        style={{ width: 72, flexShrink: 0 }}
      />
      <input
        name="produtos"
        type="number"
        step="0.01"
        min="0"
        className="form-input"
        placeholder="Produtos"
        value={prod}
        onChange={(e) => setProd(e.target.value)}
        style={{ width: 84, flexShrink: 0 }}
      />
      <select
        name="itemBibliotecaId"
        className="form-input form-select"
        defaultValue={editItem?.itemBiblioteca?.id ?? ""}
        style={{ flex: "2 1 120px", minWidth: 0 }}
      >
        <option value="">Biblioteca (opcional)</option>
        {bibliotecaItens.map((b) => (
          <option key={b.id} value={b.id}>
            {b.codigo ? `[${b.codigo}] ` : ""}{b.nome}
          </option>
        ))}
      </select>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          fontSize: 12,
          color: preview != null ? "var(--clr-success)" : "var(--clr-text-muted)",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          minWidth: 90,
        }}
      >
        = {preview != null ? fmt(preview) : "—"}
      </div>

      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          Salvar
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={pending}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── AddGrupoForm ─────────────────────────────────────────────────────────────

function AddGrupoForm({
  projetoId,
  parentId,
  placeholder,
  actions,
  onClose,
}: {
  projetoId: string
  parentId: string | null
  placeholder: string
  actions: Actions
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await actions.criarGrupo(fd)
      onClose()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}
    >
      <input type="hidden" name="projetoId" value={projetoId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <input
        name="nome"
        className="form-input"
        placeholder={placeholder}
        required
        style={{ flex: 1 }}
        autoFocus
      />
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        Salvar
      </button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={pending}>
        Cancelar
      </button>
    </form>
  )
}

// ─── Cabeçalho de tabela ─────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32px 1fr 70px 50px 80px 60px 70px 80px 86px 30px 30px",
        gap: 4,
        padding: "4px 8px",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.07em",
        color: "var(--clr-text-muted)",
        borderBottom: "2px solid var(--clr-border)",
        marginBottom: 2,
      }}
    >
      <span>#</span>
      <span>Nome</span>
      <span>Grupo</span>
      <span>Un</span>
      <span style={{ textAlign: "right" }}>Qtd</span>
      <span style={{ textAlign: "right" }}>BDI</span>
      <span style={{ textAlign: "right" }}>Custo</span>
      <span style={{ textAlign: "right" }}>Serviços</span>
      <span>Status</span>
      <span />
      <span />
    </div>
  )
}

// ─── OrcamentoTab ─────────────────────────────────────────────────────────────

export function OrcamentoTab({ items, projetoId, bibliotecaItens, actions, sessaoOtto }: Props) {
  const [pending, startTransition] = useTransition()
  const [addingCompTo, setAddingCompTo] = useState<string | null>(null)
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null)
  const [showAddNivel, setShowAddNivel] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showOtto, setShowOtto] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")

  // D4: Motor Semântico de Tarefas
  const [sugestaoTarefas, setSugestaoTarefas] = useState<{ nome: string; telefone: string; narrativa: string } | null>(null)
  const [criandoTarefas, setCriandoTarefas] = useState(false)

  useEffect(() => {
    // Exibe sugestões quando há apenas 1 item e a flag de recusa ainda não existe no localStorage
    if (items.length === 1) {
      const dismissKey = `evis_cache_v2_tarefas_sugeridas_${projetoId}`
      if (!localStorage.getItem(dismissKey)) {
        sugerirTarefasOrcamento(projetoId).then((tarefas) => {
          setSugestaoTarefas({
            nome: "Tarefas de Orçamento",
            telefone: "",
            narrativa: tarefas.join("\n"),
          })
        })
      }
    }
  }, [items.length, projetoId])

  async function handleAprovarTarefas() {
    if (!sugestaoTarefas) return
    setCriandoTarefas(true)
    const titulos = sugestaoTarefas.narrativa.split("\n").map((t) => t.trim()).filter(Boolean)
    if (titulos.length > 0) {
      await criarTarefasSugeridas(projetoId, titulos)
    }
    localStorage.setItem(`evis_cache_v2_tarefas_sugeridas_${projetoId}`, "true")
    setSugestaoTarefas(null)
    setCriandoTarefas(false)
  }

  function handleCancelarTarefas() {
    localStorage.setItem(`evis_cache_v2_tarefas_sugeridas_${projetoId}`, "true")
    setSugestaoTarefas(null)
  }

  function byParent(parentId: string | null) {
    return items
      .filter((i) => i.parentId === parentId)
      .sort((a, b) => a.posicao - b.posicao || a.nome.localeCompare(b.nome))
  }

  function statusVisible(item: Item) {
    return !statusFilter || item.statusItem === statusFilter
  }

  function groupTotal(id: string): number {
    return byParent(id).reduce((sum, c) => {
      if (c.tipo === "composicao") return sum + (c.servicos ?? 0)
      return sum + groupTotal(c.id)
    }, 0)
  }

  const composicoes = items.filter((i) => i.tipo === "composicao")
  const totalGeral = composicoes.reduce((s, i) => s + (i.servicos ?? 0), 0)

  function itemNum(id: string) {
    return String(composicoes.findIndex((c) => c.id === id) + 1).padStart(2, "0")
  }

  function excluir(id: string) {
    const fd = new FormData()
    fd.set("projetoId", projetoId)
    fd.set("id", id)
    startTransition(async () => {
      await actions.excluirItem(fd)
    })
  }

  function closeAll() {
    setAddingCompTo(null)
    setAddingSubTo(null)
    setEditingId(null)
  }

  const roots = byParent(null)

  const headerBtnStyle: React.CSSProperties = {
    background: "none",
    border: "1px solid var(--clr-border)",
    borderRadius: "var(--r-sm)",
    cursor: "pointer",
    color: "var(--clr-text-secondary)",
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 600,
    lineHeight: "20px",
  }

  const closeBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--clr-text-muted)",
    padding: "0 4px",
    fontSize: 16,
    lineHeight: 1,
    flexShrink: 0,
  }

  return (
    <div className="obra-card obra-card--full">
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span className="obra-card-label">Orçamento</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {totalGeral > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--clr-success)", fontFamily: "var(--font-mono)" }}>
              {fmt(totalGeral)}
            </span>
          )}
          <select
            className="form-input form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 132, height: 30, fontSize: 12 }}
          >
            <option value="">Todos status</option>
            <option value="para_aprovar">Para aprovar</option>
            <option value="aprovado">Aprovado</option>
            <option value="nao_aprovado">Nao aprovado</option>
          </select>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12 }}
            onClick={() => setShowOtto((v) => !v)}
          >
            Otto
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12 }}
            onClick={() => { setShowAddNivel(true); closeAll() }}
            disabled={pending}
          >
            + Grupo
          </button>
        </div>
      </div>

      {showOtto && <OttoPanel projetoId={projetoId} sessao={sessaoOtto ?? null} />}

      {showAddNivel && (
        <div style={{ marginBottom: 12 }}>
          <AddGrupoForm
            projetoId={projetoId}
            parentId={null}
            placeholder="Nome do grupo (ex: Cozinha, Ático, Geral)"
            actions={actions}
            onClose={() => setShowAddNivel(false)}
          />
        </div>
      )}

      {roots.length === 0 && !showAddNivel && (
        <div className="placeholder-block">
          Nenhum item de orçamento. Clique em &quot;+ Grupo&quot; para criar o primeiro nível.
        </div>
      )}

      {sugestaoTarefas && (
        <div style={{ marginBottom: 16 }}>
          <SugestaoCard
            sugestao={sugestaoTarefas}
            onChange={setSugestaoTarefas}
            onAprovar={handleAprovarTarefas}
            onCancelar={handleCancelarTarefas}
            criando={criandoTarefas}
          />
        </div>
      )}

      {roots.length > 0 && <TableHeader />}

      {roots.map((nivel) => {
        const nivelChildren = byParent(nivel.id)
        const nivelSubniveis = nivelChildren.filter((c) => c.tipo === "subnivel")
        const nivelComps = nivelChildren.filter((c) => c.tipo === "composicao")

        return (
          <div key={nivel.id} style={{ marginBottom: 6 }}>
            {/* Nivel header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 10px",
                background: "var(--clr-surface-hover)",
                borderRadius: "var(--r-sm)",
                borderLeft: "3px solid var(--clr-primary)",
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontWeight: 700,
                  fontSize: 12,
                  color: "var(--clr-text)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {nivel.nome}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--clr-success)",
                  fontFamily: "var(--font-mono)",
                  minWidth: 80,
                  textAlign: "right",
                }}
              >
                {groupTotal(nivel.id) > 0 ? fmt(groupTotal(nivel.id)) : ""}
              </span>
              <button
                type="button"
                style={headerBtnStyle}
                onClick={() => { setAddingSubTo(nivel.id); setAddingCompTo(null); setShowAddNivel(false) }}
                disabled={pending}
              >
                + Subnível
              </button>
              <button
                type="button"
                style={headerBtnStyle}
                onClick={() => { setAddingCompTo(nivel.id); setAddingSubTo(null); setShowAddNivel(false); setEditingId(null) }}
                disabled={pending}
              >
                + Item
              </button>
              <button type="button" style={closeBtnStyle} onClick={() => excluir(nivel.id)} disabled={pending} title="Excluir grupo">
                ×
              </button>
            </div>

            {/* Subnivel add form */}
            {addingSubTo === nivel.id && (
              <div style={{ marginLeft: 16, marginBottom: 4 }}>
                <AddGrupoForm
                  projetoId={projetoId}
                  parentId={nivel.id}
                  placeholder="Nome do subnível (ex: Paredes, Piso)"
                  actions={actions}
                  onClose={() => setAddingSubTo(null)}
                />
              </div>
            )}

            {/* Subniveis */}
            {nivelSubniveis.map((sub) => {
              const subComps = byParent(sub.id)
              return (
                <div key={sub.id} style={{ marginLeft: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      background: "var(--clr-surface)",
                      borderRadius: "var(--r-sm)",
                      borderLeft: "2px solid var(--clr-border)",
                      marginBottom: 2,
                      marginTop: 2,
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontWeight: 600,
                        fontSize: 11,
                        color: "var(--clr-text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {sub.nome}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--clr-success)",
                        fontFamily: "var(--font-mono)",
                        minWidth: 80,
                        textAlign: "right",
                      }}
                    >
                      {groupTotal(sub.id) > 0 ? fmt(groupTotal(sub.id)) : ""}
                    </span>
                    <button
                      type="button"
                      style={headerBtnStyle}
                      onClick={() => { setAddingCompTo(sub.id); setAddingSubTo(null); setShowAddNivel(false); setEditingId(null) }}
                      disabled={pending}
                    >
                      + Item
                    </button>
                    <button type="button" style={closeBtnStyle} onClick={() => excluir(sub.id)} disabled={pending} title="Excluir subnível">
                      ×
                    </button>
                  </div>

                  {/* Composicoes do subnivel */}
                  {subComps.filter(statusVisible).map((comp) =>
                    editingId === comp.id ? (
                      <ComposicaoForm
                        key={comp.id}
                        projetoId={projetoId}
                        parentId={sub.id}
                        bibliotecaItens={bibliotecaItens}
                        actions={actions}
                        onClose={() => setEditingId(null)}
                        editItem={comp}
                      />
                    ) : (
                      <ComposicaoRow
                        key={comp.id}
                        item={comp}
                        num={itemNum(comp.id)}
                        onEdit={() => { setEditingId(comp.id); setAddingCompTo(null) }}
                        onExcluir={() => excluir(comp.id)}
                        pending={pending}
                      />
                    )
                  )}

                  {addingCompTo === sub.id && (
                    <ComposicaoForm
                      projetoId={projetoId}
                      parentId={sub.id}
                      bibliotecaItens={bibliotecaItens}
                      actions={actions}
                      onClose={() => setAddingCompTo(null)}
                    />
                  )}
                </div>
              )
            })}

            {/* Composicoes diretas do nivel */}
            {nivelComps.filter(statusVisible).map((comp) =>
              editingId === comp.id ? (
                <ComposicaoForm
                  key={comp.id}
                  projetoId={projetoId}
                  parentId={nivel.id}
                  bibliotecaItens={bibliotecaItens}
                  actions={actions}
                  onClose={() => setEditingId(null)}
                  editItem={comp}
                />
              ) : (
                <ComposicaoRow
                  key={comp.id}
                  item={comp}
                  num={itemNum(comp.id)}
                  onEdit={() => { setEditingId(comp.id); setAddingCompTo(null) }}
                  onExcluir={() => excluir(comp.id)}
                  pending={pending}
                />
              )
            )}

            {addingCompTo === nivel.id && (
              <ComposicaoForm
                projetoId={projetoId}
                parentId={nivel.id}
                bibliotecaItens={bibliotecaItens}
                actions={actions}
                onClose={() => setAddingCompTo(null)}
              />
            )}
          </div>
        )
      })}

      {/* Footer total */}
      {composicoes.length > 0 && (
        <div
          style={{
            borderTop: "2px solid var(--clr-border)",
            marginTop: 12,
            paddingTop: 10,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--clr-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
            Total geral do orçamento
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--clr-success)", fontFamily: "var(--font-mono)" }}>
            {fmt(totalGeral)}
          </span>
        </div>
      )}
    </div>
  )
}
