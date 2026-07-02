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
  tipoItem: string | null
  categoriaItemId: string | null
  classe: string | null
  categoriaItem: { id: string; nome: string } | null
  fornecedor: { id: string; nome: string } | null
  unidade: string | null
  quantidade: number | null
  custoUnitario: number | null
  custoServicos: number | null
  produtos: number | null
  custoTotal: number | null
  bdi: number | null
  precoUnitario: number | null
  servicos: number | null
  precoTotal: number | null
  statusItem: string | null
  itemBiblioteca: { id: string; nome: string; codigo: string | null } | null
}

type BibItem = { id: string; nome: string; codigo: string | null }
type CatItem = { id: string; nome: string }

type Actions = {
  criarGrupo: (fd: FormData) => Promise<void>
  criarItem: (fd: FormData) => Promise<void>
  editarItem: (fd: FormData) => Promise<void>
  excluirItem: (fd: FormData) => Promise<void>
  salvarConfig: (fd: FormData) => Promise<void>
}

type Props = {
  items: Item[]
  projetoId: string
  bibliotecaItens: BibItem[]
  categoriasItem: CatItem[]
  bdiPadraoProdutos: number
  bdiPadraoServicos: number
  actions: Actions
  sessaoOtto?: SessaoOtto | null
}

function fmt(v: number | null): string {
  if (v == null) return "—"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function calcPrecoTotal(cs: number | null, bdi: number | null, prod: number | null): number | null {
  const cost = ((cs ?? 0) + (prod ?? 0))
  if (!cost || bdi == null) return null
  return cost * (1 + bdi / 100)
}

const tipoItemIcon: Record<string, string> = {
  produto: "⬜",
  servico: "⚙",
  composicao: "⬡",
}

const tipoItemLabel: Record<string, string> = {
  produto: "Produto",
  servico: "Serviço",
  composicao: "Composição",
}

const statusItemLabel: Record<string, string> = {
  para_aprovar: "Para aprovar",
  aprovado: "Aprovado",
  nao_aprovado: "Não aprovado",
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
  const precoDisplay = item.precoTotal ?? item.servicos

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "28px 18px 1fr 80px 72px 48px 80px 54px 72px 84px 30px 30px",
        gap: 4,
        alignItems: "center",
        padding: "5px 8px",
        borderBottom: "1px solid var(--clr-border-light)",
        fontSize: 12,
        color: "var(--clr-text)",
      }}
    >
      <span style={{ color: "var(--clr-text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{num}</span>
      <span title={tipoItemLabel[item.tipoItem ?? ""] ?? ""} style={{ fontSize: 11, color: "var(--clr-text-muted)", cursor: "default" }}>
        {tipoItemIcon[item.tipoItem ?? ""] ?? "·"}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.nome}>
        {item.nome}
        {item.classe && <span style={{ marginLeft: 4, fontSize: 10, color: "var(--clr-text-muted)", fontFamily: "var(--font-mono)" }}>[{item.classe}]</span>}
      </span>
      <span style={{ color: "var(--clr-text-muted)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.categoriaItem?.nome}>
        {item.categoriaItem?.nome ?? "—"}
      </span>
      <span style={{ color: "var(--clr-text-muted)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.fornecedor?.nome}>
        {item.fornecedor?.nome ?? "—"}
      </span>
      <span style={{ color: "var(--clr-text-muted)", fontSize: 11 }}>{item.unidade ?? "—"}</span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
        {item.quantidade != null ? item.quantidade.toLocaleString("pt-BR") : "—"}
      </span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
        {item.bdi != null ? `${item.bdi}%` : "—"}
      </span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmt(item.custoTotal ?? (((item.custoServicos ?? 0) + (item.produtos ?? 0)) || null))}</span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--clr-success)" }}>
        {fmt(precoDisplay)}
      </span>
      <span>
        {item.statusItem && (
          <span className={`badge ${statusItemClass[item.statusItem] ?? "badge-previsto"}`} style={{ fontSize: 10, whiteSpace: "nowrap" }}>
            {statusItemLabel[item.statusItem] ?? item.statusItem}
          </span>
        )}
      </span>
      <button type="button" onClick={onEdit} disabled={pending} title="Editar"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clr-primary)", padding: "2px 4px", fontSize: 12 }}>✎</button>
      <button type="button" onClick={onExcluir} disabled={pending} title="Excluir"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clr-text-muted)", padding: "2px 4px", fontSize: 14, lineHeight: 1 }}>×</button>
    </div>
  )
}

// ─── ComposicaoForm ────────────────────────────────────────────────────────────

function ComposicaoForm({
  projetoId,
  parentId,
  bibliotecaItens,
  categoriasItem,
  bdiPadraoProdutos,
  bdiPadraoServicos,
  actions,
  onClose,
  editItem,
}: {
  projetoId: string
  parentId: string
  bibliotecaItens: BibItem[]
  categoriasItem: CatItem[]
  bdiPadraoProdutos: number
  bdiPadraoServicos: number
  actions: Actions
  onClose: () => void
  editItem?: Item
}) {
  const [pending, startTransition] = useTransition()
  const [tipoItem, setTipoItem] = useState(editItem?.tipoItem ?? "")
  const [cs, setCS] = useState(editItem?.custoServicos?.toString() ?? "")
  const [prod, setProd] = useState(editItem?.produtos?.toString() ?? "")
  const [bdi, setBDI] = useState(() => {
    if (editItem?.bdi != null) return editItem.bdi.toString()
    return bdiPadraoServicos.toString()
  })

  // auto-fill BDI when tipoItem changes (only on create)
  useEffect(() => {
    if (editItem) return
    if (tipoItem === "produto") setBDI(bdiPadraoProdutos.toString())
    else if (tipoItem === "servico") setBDI(bdiPadraoServicos.toString())
  }, [tipoItem, editItem, bdiPadraoProdutos, bdiPadraoServicos])

  const custoTotalPreview = (parseFloat(cs) || 0) + (parseFloat(prod) || 0)
  const precoPreview = custoTotalPreview > 0 && parseFloat(bdi) >= 0
    ? custoTotalPreview * (1 + parseFloat(bdi) / 100)
    : null

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

  const inputStyle: React.CSSProperties = { height: 30, fontSize: 12 }

  return (
    <form onSubmit={handleSubmit} style={{
      display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 12px",
      background: "var(--clr-surface)", borderRadius: "var(--r-sm)",
      border: "1px solid var(--clr-border)", marginTop: 4, marginLeft: editItem ? 0 : 8,
    }}>
      <input type="hidden" name="projetoId" value={projetoId} />
      <input type="hidden" name="parentId" value={parentId} />
      {editItem && <input type="hidden" name="id" value={editItem.id} />}

      {/* Nome */}
      <input name="nome" className="form-input" placeholder="Nome do item" required
        defaultValue={editItem?.nome ?? ""} style={{ flex: "3 1 180px", minWidth: 0, ...inputStyle }} />

      {/* Tipo semântico */}
      <select name="tipoItem" className="form-input form-select" value={tipoItem}
        onChange={(e) => setTipoItem(e.target.value)} style={{ width: 112, flexShrink: 0, ...inputStyle }}>
        <option value="">Tipo</option>
        <option value="produto">Produto</option>
        <option value="servico">Serviço</option>
        <option value="composicao">Composição</option>
      </select>

      {/* Categoria */}
      <select name="categoriaItemId" className="form-input form-select"
        defaultValue={editItem?.categoriaItem?.id ?? ""} style={{ flex: "2 1 110px", minWidth: 0, ...inputStyle }}>
        <option value="">Categoria</option>
        {categoriasItem.map((c) => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>

      {/* Grupo */}
      <input name="grupo" className="form-input" placeholder="Grupo/cômodo"
        defaultValue={editItem?.grupo ?? ""} style={{ flex: "1 1 80px", minWidth: 0, ...inputStyle }} />

      {/* Classe */}
      <input name="classe" className="form-input" placeholder="Classe (ex: SINAPI)"
        defaultValue={editItem?.classe ?? ""} style={{ width: 110, flexShrink: 0, ...inputStyle }} />

      {/* Unidade */}
      <input name="unidade" className="form-input" placeholder="Un"
        defaultValue={editItem?.unidade ?? ""} style={{ width: 48, flexShrink: 0, ...inputStyle }} />

      {/* Quantidade */}
      <input name="quantidade" type="number" step="0.0001" min="0" className="form-input" placeholder="Qtd"
        defaultValue={editItem?.quantidade?.toString() ?? ""} style={{ width: 72, flexShrink: 0, ...inputStyle }} />

      {/* Custo unitário */}
      <input name="custoUnitario" type="number" step="0.01" min="0" className="form-input" placeholder="Custo un."
        defaultValue={editItem?.custoUnitario?.toString() ?? ""} style={{ width: 84, flexShrink: 0, ...inputStyle }} />

      {/* Custo serviços */}
      <input name="custoServicos" type="number" step="0.01" min="0" className="form-input" placeholder="C. serviços"
        value={cs} onChange={(e) => setCS(e.target.value)} style={{ width: 90, flexShrink: 0, ...inputStyle }} />

      {/* Custo produtos */}
      <input name="produtos" type="number" step="0.01" min="0" className="form-input" placeholder="C. produtos"
        value={prod} onChange={(e) => setProd(e.target.value)} style={{ width: 90, flexShrink: 0, ...inputStyle }} />

      {/* BDI */}
      <input name="bdi" type="number" step="0.01" min="0" className="form-input" placeholder="BDI %"
        value={bdi} onChange={(e) => setBDI(e.target.value)} style={{ width: 70, flexShrink: 0, ...inputStyle }} />

      {/* Status */}
      <select name="statusItem" className="form-input form-select"
        defaultValue={editItem?.statusItem ?? ""} style={{ width: 120, flexShrink: 0, ...inputStyle }}>
        <option value="">Status</option>
        <option value="para_aprovar">Para aprovar</option>
        <option value="aprovado">Aprovado</option>
        <option value="nao_aprovado">Não aprovado</option>
      </select>

      {/* Biblioteca */}
      <select name="itemBibliotecaId" className="form-input form-select"
        defaultValue={editItem?.itemBiblioteca?.id ?? ""} style={{ flex: "2 1 120px", minWidth: 0, ...inputStyle }}>
        <option value="">Biblioteca (opcional)</option>
        {bibliotecaItens.map((b) => (
          <option key={b.id} value={b.id}>{b.codigo ? `[${b.codigo}] ` : ""}{b.nome}</option>
        ))}
      </select>

      {/* Preview preço total */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, flexShrink: 0, fontSize: 12,
        color: precoPreview != null ? "var(--clr-success)" : "var(--clr-text-muted)",
        fontFamily: "var(--font-mono)", fontWeight: 600, minWidth: 110,
      }}>
        <span style={{ fontSize: 10, color: "var(--clr-text-muted)" }}>Preço total:</span>
        {precoPreview != null
          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(precoPreview)
          : "—"}
      </div>

      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>Salvar</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={pending}>Cancelar</button>
      </div>
    </form>
  )
}

// ─── AddGrupoForm ─────────────────────────────────────────────────────────────

function AddGrupoForm({
  projetoId, parentId, placeholder, actions, onClose,
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
    startTransition(async () => { await actions.criarGrupo(fd); onClose() })
  }
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
      <input type="hidden" name="projetoId" value={projetoId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <input name="nome" className="form-input" placeholder={placeholder} required style={{ flex: 1, height: 30 }} autoFocus />
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>Salvar</button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={pending}>Cancelar</button>
    </form>
  )
}

// ─── ConfigBdiPanel ────────────────────────────────────────────────────────────

function ConfigBdiPanel({
  projetoId, bdiPadraoProdutos, bdiPadraoServicos, action, onClose,
}: {
  projetoId: string
  bdiPadraoProdutos: number
  bdiPadraoServicos: number
  action: (fd: FormData) => Promise<void>
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => { await action(fd); onClose() })
  }
  return (
    <div style={{
      marginBottom: 12, padding: "12px 16px", background: "var(--clr-surface)",
      border: "1px solid var(--clr-border)", borderRadius: "var(--r-sm)",
    }}>
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="projetoId" value={projetoId} />
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--clr-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            BDI Padrão deste projeto
          </span>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            Produtos %
            <input name="bdiPadraoP" type="number" step="0.01" min="0" className="form-input"
              defaultValue={bdiPadraoProdutos.toString()} style={{ width: 70, height: 28 }} />
          </label>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            Serviços %
            <input name="bdiPadraoS" type="number" step="0.01" min="0" className="form-input"
              defaultValue={bdiPadraoServicos.toString()} style={{ width: 70, height: 28 }} />
          </label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>Salvar BDI</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={pending}>Fechar</button>
        </div>
        <p style={{ fontSize: 11, color: "var(--clr-text-muted)", marginTop: 6, marginBottom: 0 }}>
          O BDI padrão é aplicado automaticamente ao criar novos itens conforme o tipo selecionado.
        </p>
      </form>
    </div>
  )
}

// ─── TableHeader ─────────────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "28px 18px 1fr 80px 72px 48px 80px 54px 72px 84px 30px 30px",
      gap: 4, padding: "4px 8px", fontSize: 10, fontWeight: 700,
      textTransform: "uppercase" as const, letterSpacing: "0.07em",
      color: "var(--clr-text-muted)", borderBottom: "2px solid var(--clr-border)", marginBottom: 2,
    }}>
      <span>#</span><span />
      <span>Nome</span>
      <span>Categoria</span>
      <span>Fornecedor</span>
      <span>Un</span>
      <span style={{ textAlign: "right" }}>Qtd</span>
      <span style={{ textAlign: "right" }}>BDI</span>
      <span style={{ textAlign: "right" }}>Custo</span>
      <span style={{ textAlign: "right" }}>Preço</span>
      <span /><span />
    </div>
  )
}

// ─── OrcamentoTab ─────────────────────────────────────────────────────────────

export function OrcamentoTab({
  items, projetoId, bibliotecaItens, categoriasItem,
  bdiPadraoProdutos, bdiPadraoServicos, actions, sessaoOtto,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [addingCompTo, setAddingCompTo] = useState<string | null>(null)
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null)
  const [showAddNivel, setShowAddNivel] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showOtto, setShowOtto] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  // Filtros
  const [tipoFilter, setTipoFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("")
  const [fornecedorFilter, setFornecedorFilter] = useState("")

  // Visualização
  const [viewMode, setViewMode] = useState<"lista" | "grupo" | "categoria" | "fornecedor">("lista")

  // Motor semântico de tarefas (D4)
  const [sugestaoTarefas, setSugestaoTarefas] = useState<{ nome: string; telefone: string; narrativa: string } | null>(null)
  const [criandoTarefas, setCriandoTarefas] = useState(false)

  useEffect(() => {
    if (items.length === 1) {
      const dismissKey = `evis_cache_v2_tarefas_sugeridas_${projetoId}`
      if (!localStorage.getItem(dismissKey)) {
        sugerirTarefasOrcamento(projetoId).then((tarefas) => {
          setSugestaoTarefas({ nome: "Tarefas de Orçamento", telefone: "", narrativa: tarefas.join("\n") })
        })
      }
    }
  }, [items.length, projetoId])

  async function handleAprovarTarefas() {
    if (!sugestaoTarefas) return
    setCriandoTarefas(true)
    const titulos = sugestaoTarefas.narrativa.split("\n").map((t) => t.trim()).filter(Boolean)
    if (titulos.length > 0) await criarTarefasSugeridas(projetoId, titulos)
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

  function isVisible(item: Item) {
    if (tipoFilter && item.tipoItem !== tipoFilter) return false
    if (statusFilter && item.statusItem !== statusFilter) return false
    if (categoriaFilter && item.categoriaItem?.id !== categoriaFilter) return false
    if (fornecedorFilter && item.fornecedor?.id !== fornecedorFilter) return false
    return true
  }

  function groupTotal(id: string): number {
    return byParent(id).reduce((sum, c) => {
      if (c.tipo === "composicao") return sum + ((c.precoTotal ?? c.servicos) ?? 0)
      return sum + groupTotal(c.id)
    }, 0)
  }

  const composicoes = items.filter((i) => i.tipo === "composicao")
  const totalGeral = composicoes.reduce((s, i) => s + ((i.precoTotal ?? i.servicos) ?? 0), 0)

  function itemNum(id: string) {
    return String(composicoes.findIndex((c) => c.id === id) + 1).padStart(2, "0")
  }

  function excluir(id: string) {
    const fd = new FormData()
    fd.set("projetoId", projetoId)
    fd.set("id", id)
    startTransition(async () => { await actions.excluirItem(fd) })
  }

  function closeAll() {
    setAddingCompTo(null)
    setAddingSubTo(null)
    setEditingId(null)
  }

  // Derived data for filters
  const fornecedoresDisponiveis = Array.from(
    new Map(composicoes.filter((i) => i.fornecedor).map((i) => [i.fornecedor!.id, i.fornecedor!])).values()
  )
  const activeFilters = [tipoFilter, statusFilter, categoriaFilter, fornecedorFilter].filter(Boolean).length

  const roots = byParent(null)

  // ─── Visualização agrupada ─────────────────────────────────────────────────

  function renderGroupedView() {
    let groupedItems: [string, Item[]][]
    if (viewMode === "grupo") {
      const map = new Map<string, Item[]>()
      composicoes.filter(isVisible).forEach((i) => {
        const key = i.grupo ?? "(Sem grupo)"
        const arr = map.get(key) ?? []
        arr.push(i)
        map.set(key, arr)
      })
      groupedItems = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
    } else if (viewMode === "categoria") {
      const map = new Map<string, Item[]>()
      composicoes.filter(isVisible).forEach((i) => {
        const key = i.categoriaItem?.nome ?? "(Sem categoria)"
        const arr = map.get(key) ?? []
        arr.push(i)
        map.set(key, arr)
      })
      groupedItems = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
    } else {
      const map = new Map<string, Item[]>()
      composicoes.filter(isVisible).forEach((i) => {
        const key = i.fornecedor?.nome ?? "(Sem fornecedor)"
        const arr = map.get(key) ?? []
        arr.push(i)
        map.set(key, arr)
      })
      groupedItems = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
    }

    return (
      <>
        <TableHeader />
        {groupedItems.map(([groupKey, groupItems]) => {
          const groupTotal = groupItems.reduce((s, i) => s + ((i.precoTotal ?? i.servicos) ?? 0), 0)
          return (
            <div key={groupKey} style={{ marginBottom: 6 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                background: "var(--clr-surface-hover)", borderRadius: "var(--r-sm)",
                borderLeft: "3px solid var(--clr-primary)", marginBottom: 2,
              }}>
                <span style={{ flex: 1, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {groupKey}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--clr-success)", fontFamily: "var(--font-mono)" }}>
                  {groupTotal > 0 ? fmt(groupTotal) : ""}
                </span>
              </div>
              {groupItems.map((comp) =>
                editingId === comp.id ? (
                  <ComposicaoForm
                    key={comp.id}
                    projetoId={projetoId}
                    parentId={comp.parentId ?? ""}
                    bibliotecaItens={bibliotecaItens}
                    categoriasItem={categoriasItem}
                    bdiPadraoProdutos={bdiPadraoProdutos}
                    bdiPadraoServicos={bdiPadraoServicos}
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
            </div>
          )
        })}
      </>
    )
  }

  const headerBtnStyle: React.CSSProperties = {
    background: "none", border: "1px solid var(--clr-border)", borderRadius: "var(--r-sm)",
    cursor: "pointer", color: "var(--clr-text-secondary)", padding: "2px 8px",
    fontSize: 11, fontWeight: 600, lineHeight: "20px",
  }

  const closeBtnStyle: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--clr-text-muted)", padding: "0 4px", fontSize: 16, lineHeight: 1, flexShrink: 0,
  }

  return (
    <div className="obra-card obra-card--full">
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <span className="obra-card-label">
          Orçamento
          {totalGeral > 0 && (
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 700, color: "var(--clr-success)", fontFamily: "var(--font-mono)" }}>
              {fmt(totalGeral)}
            </span>
          )}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}
            onClick={() => { setShowConfig((v) => !v); setShowOtto(false) }}>
            ⚙ BDI
          </button>
          <button type="button" className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}
            onClick={() => { setShowOtto((v) => !v); setShowConfig(false) }}>
            Otto
          </button>
          <button type="button" className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}
            onClick={() => { setShowAddNivel(true); closeAll() }} disabled={pending}>
            + Grupo
          </button>
        </div>
      </div>

      {/* Config BDI */}
      {showConfig && (
        <ConfigBdiPanel
          projetoId={projetoId}
          bdiPadraoProdutos={bdiPadraoProdutos}
          bdiPadraoServicos={bdiPadraoServicos}
          action={actions.salvarConfig}
          onClose={() => setShowConfig(false)}
        />
      )}

      {/* Otto */}
      {showOtto && <OttoPanel projetoId={projetoId} sessao={sessaoOtto ?? null} />}

      {/* Barra de filtros */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
        <select className="form-input form-select" value={viewMode}
          onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
          style={{ height: 28, fontSize: 11, width: 130 }}>
          <option value="lista">Lista</option>
          <option value="grupo">Por grupo</option>
          <option value="categoria">Por categoria</option>
          <option value="fornecedor">Por fornecedor</option>
        </select>

        <select className="form-input form-select" value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          style={{ height: 28, fontSize: 11, width: 120 }}>
          <option value="">Todos os tipos</option>
          <option value="produto">Produto</option>
          <option value="servico">Serviço</option>
          <option value="composicao">Composição</option>
        </select>

        <select className="form-input form-select" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ height: 28, fontSize: 11, width: 130 }}>
          <option value="">Todos os status</option>
          <option value="para_aprovar">Para aprovar</option>
          <option value="aprovado">Aprovado</option>
          <option value="nao_aprovado">Não aprovado</option>
        </select>

        {categoriasItem.length > 0 && (
          <select className="form-input form-select" value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            style={{ height: 28, fontSize: 11, width: 140 }}>
            <option value="">Todas categorias</option>
            {categoriasItem.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}

        {fornecedoresDisponiveis.length > 0 && (
          <select className="form-input form-select" value={fornecedorFilter}
            onChange={(e) => setFornecedorFilter(e.target.value)}
            style={{ height: 28, fontSize: 11, width: 140 }}>
            <option value="">Todos fornecedores</option>
            {fornecedoresDisponiveis.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        )}

        {activeFilters > 0 && (
          <button type="button" onClick={() => { setTipoFilter(""); setStatusFilter(""); setCategoriaFilter(""); setFornecedorFilter("") }}
            style={{ fontSize: 11, color: "var(--clr-text-muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}>
            ✕ Limpar filtros ({activeFilters})
          </button>
        )}
      </div>

      {/* Add nível */}
      {showAddNivel && (
        <div style={{ marginBottom: 12 }}>
          <AddGrupoForm projetoId={projetoId} parentId={null}
            placeholder="Nome do grupo (ex: Estrutura, Acabamento, Cozinha)"
            actions={actions} onClose={() => setShowAddNivel(false)} />
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
            sugestao={sugestaoTarefas} onChange={setSugestaoTarefas}
            onAprovar={handleAprovarTarefas} onCancelar={handleCancelarTarefas}
            criando={criandoTarefas}
          />
        </div>
      )}

      {/* ─── Visualização agrupada ─── */}
      {viewMode !== "lista" && composicoes.length > 0 ? renderGroupedView() : null}

      {/* ─── Visualização em lista (hierarquia) ─── */}
      {viewMode === "lista" && (
        <>
          {roots.length > 0 && <TableHeader />}
          {roots.map((nivel) => {
            const nivelChildren = byParent(nivel.id)
            const nivelSubniveis = nivelChildren.filter((c) => c.tipo === "subnivel")
            const nivelComps = nivelChildren.filter((c) => c.tipo === "composicao")

            return (
              <div key={nivel.id} style={{ marginBottom: 6 }}>
                {/* Nível header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 10px",
                  background: "var(--clr-surface-hover)", borderRadius: "var(--r-sm)",
                  borderLeft: "3px solid var(--clr-primary)", marginBottom: 2,
                }}>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {nivel.nome}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--clr-success)", fontFamily: "var(--font-mono)", minWidth: 80, textAlign: "right" }}>
                    {groupTotal(nivel.id) > 0 ? fmt(groupTotal(nivel.id)) : ""}
                  </span>
                  <button type="button" style={headerBtnStyle}
                    onClick={() => { setAddingSubTo(nivel.id); setAddingCompTo(null); setShowAddNivel(false) }} disabled={pending}>
                    + Subnível
                  </button>
                  <button type="button" style={headerBtnStyle}
                    onClick={() => { setAddingCompTo(nivel.id); setAddingSubTo(null); setShowAddNivel(false); setEditingId(null) }} disabled={pending}>
                    + Item
                  </button>
                  <button type="button" style={closeBtnStyle} onClick={() => excluir(nivel.id)} disabled={pending} title="Excluir grupo">×</button>
                </div>

                {/* Subnível add form */}
                {addingSubTo === nivel.id && (
                  <div style={{ marginLeft: 16, marginBottom: 4 }}>
                    <AddGrupoForm projetoId={projetoId} parentId={nivel.id}
                      placeholder="Nome do subnível (ex: Paredes, Piso)" actions={actions} onClose={() => setAddingSubTo(null)} />
                  </div>
                )}

                {/* Subníveis */}
                {nivelSubniveis.map((sub) => {
                  const subComps = byParent(sub.id)
                  return (
                    <div key={sub.id} style={{ marginLeft: 16 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
                        background: "var(--clr-surface)", borderRadius: "var(--r-sm)",
                        borderLeft: "2px solid var(--clr-border)", marginBottom: 2, marginTop: 2,
                      }}>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--clr-text-secondary)" }}>
                          {sub.nome}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--clr-success)", fontFamily: "var(--font-mono)", minWidth: 80, textAlign: "right" }}>
                          {groupTotal(sub.id) > 0 ? fmt(groupTotal(sub.id)) : ""}
                        </span>
                        <button type="button" style={headerBtnStyle}
                          onClick={() => { setAddingCompTo(sub.id); setAddingSubTo(null); setShowAddNivel(false); setEditingId(null) }} disabled={pending}>
                          + Item
                        </button>
                        <button type="button" style={closeBtnStyle} onClick={() => excluir(sub.id)} disabled={pending} title="Excluir subnível">×</button>
                      </div>

                      {subComps.filter(isVisible).map((comp) =>
                        editingId === comp.id ? (
                          <ComposicaoForm
                            key={comp.id} projetoId={projetoId} parentId={sub.id}
                            bibliotecaItens={bibliotecaItens} categoriasItem={categoriasItem}
                            bdiPadraoProdutos={bdiPadraoProdutos} bdiPadraoServicos={bdiPadraoServicos}
                            actions={actions} onClose={() => setEditingId(null)} editItem={comp}
                          />
                        ) : (
                          <ComposicaoRow
                            key={comp.id} item={comp} num={itemNum(comp.id)}
                            onEdit={() => { setEditingId(comp.id); setAddingCompTo(null) }}
                            onExcluir={() => excluir(comp.id)} pending={pending}
                          />
                        )
                      )}

                      {addingCompTo === sub.id && (
                        <ComposicaoForm projetoId={projetoId} parentId={sub.id}
                          bibliotecaItens={bibliotecaItens} categoriasItem={categoriasItem}
                          bdiPadraoProdutos={bdiPadraoProdutos} bdiPadraoServicos={bdiPadraoServicos}
                          actions={actions} onClose={() => setAddingCompTo(null)} />
                      )}
                    </div>
                  )
                })}

                {/* Composições diretas do nível */}
                {nivelComps.filter(isVisible).map((comp) =>
                  editingId === comp.id ? (
                    <ComposicaoForm
                      key={comp.id} projetoId={projetoId} parentId={nivel.id}
                      bibliotecaItens={bibliotecaItens} categoriasItem={categoriasItem}
                      bdiPadraoProdutos={bdiPadraoProdutos} bdiPadraoServicos={bdiPadraoServicos}
                      actions={actions} onClose={() => setEditingId(null)} editItem={comp}
                    />
                  ) : (
                    <ComposicaoRow
                      key={comp.id} item={comp} num={itemNum(comp.id)}
                      onEdit={() => { setEditingId(comp.id); setAddingCompTo(null) }}
                      onExcluir={() => excluir(comp.id)} pending={pending}
                    />
                  )
                )}

                {addingCompTo === nivel.id && (
                  <ComposicaoForm projetoId={projetoId} parentId={nivel.id}
                    bibliotecaItens={bibliotecaItens} categoriasItem={categoriasItem}
                    bdiPadraoProdutos={bdiPadraoProdutos} bdiPadraoServicos={bdiPadraoServicos}
                    actions={actions} onClose={() => setAddingCompTo(null)} />
                )}
              </div>
            )
          })}
        </>
      )}

      {/* Footer total */}
      {composicoes.length > 0 && (
        <div style={{
          borderTop: "2px solid var(--clr-border)", marginTop: 12, paddingTop: 10,
          display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12,
        }}>
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
