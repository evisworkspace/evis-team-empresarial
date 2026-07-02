"use client"
import { useState, useTransition, useEffect } from "react"
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
// 10 colunas: N°+ícone | Nome | Grupo | Un | Qtd | BDI | Custo | Preço | Status | Ações
const ROW_COLS = "52px 1fr 84px 44px 60px 52px 88px 90px 84px 56px"

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
  const custoDisplay = item.custoTotal ?? (((item.custoServicos ?? 0) + (item.produtos ?? 0)) || null)

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: ROW_COLS,
      gap: 4, alignItems: "center", padding: "5px 8px",
      borderBottom: "1px solid var(--clr-border-light)",
      fontSize: 12, color: "var(--clr-text)",
    }}>
      {/* N° + ícone */}
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{ color: "var(--clr-text-muted)", fontFamily: "var(--font-mono)", fontSize: 11, minWidth: 24, flexShrink: 0 }}>{num}</span>
        <span title={tipoItemLabel[item.tipoItem ?? ""] ?? "Item"} style={{ fontSize: 11, color: "var(--clr-text-muted)", flexShrink: 0 }}>
          {tipoItemIcon[item.tipoItem ?? ""] ?? "·"}
        </span>
      </div>
      {/* Nome */}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.nome}>
        {item.nome}
      </span>
      {/* Grupo */}
      <span style={{ fontSize: 11, color: "var(--clr-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {item.grupo ?? "—"}
      </span>
      {/* Un */}
      <span style={{ color: "var(--clr-text-muted)", fontSize: 11, textAlign: "center" }}>{item.unidade ?? "—"}</span>
      {/* Qtd */}
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
        {item.quantidade != null ? item.quantidade.toLocaleString("pt-BR") : "—"}
      </span>
      {/* BDI */}
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
        {item.bdi != null ? `${item.bdi}%` : "—"}
      </span>
      {/* Custo total */}
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--clr-text-secondary)" }}>
        {fmt(custoDisplay)}
      </span>
      {/* Preço total */}
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--clr-success)" }}>
        {fmt(precoDisplay)}
      </span>
      {/* Status */}
      <div style={{ textAlign: "center" }}>
        {item.statusItem && item.statusItem !== "para_aprovar" && (
          <span className={`badge ${statusItemClass[item.statusItem] ?? "badge-previsto"}`} style={{ fontSize: 10 }}>
            {statusItemLabel[item.statusItem] ?? item.statusItem}
          </span>
        )}
        {item.statusItem === "para_aprovar" && (
          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "var(--clr-warning, #f59e0b)", flexShrink: 0 }} title="Para aprovar" />
        )}
      </div>
      {/* Ações — tudo numa célula */}
      <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <button type="button" onClick={onEdit} disabled={pending} title="Editar"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clr-primary)", padding: "2px 4px", fontSize: 12 }}>✎</button>
        <button type="button" onClick={onExcluir} disabled={pending} title="Excluir"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clr-text-muted)", padding: "2px 4px", fontSize: 14, lineHeight: 1 }}>×</button>
      </div>
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
  const [custo, setCusto] = useState(editItem?.custoUnitario?.toString() ?? "")
  const [qtd, setQtd] = useState(editItem?.quantidade?.toString() ?? "1")
  const [bdi, setBDI] = useState(() => {
    if (editItem?.bdi != null) return editItem.bdi.toString()
    return bdiPadraoServicos.toString()
  })

  useEffect(() => {
    if (editItem) return
    if (tipoItem === "produto") setBDI(bdiPadraoProdutos.toString())
    else if (tipoItem === "servico") setBDI(bdiPadraoServicos.toString())
  }, [tipoItem, editItem, bdiPadraoProdutos, bdiPadraoServicos])

  const custoTotal = (parseFloat(custo) || 0) * (parseFloat(qtd) || 1)
  const precoPreview = custoTotal > 0 && parseFloat(bdi) >= 0
    ? custoTotal * (1 + parseFloat(bdi) / 100)
    : null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      if (editItem) await actions.editarItem(fd)
      else await actions.criarItem(fd)
      onClose()
    })
  }

  const inp: React.CSSProperties = { height: 32, fontSize: 12 }

  return (
    <form onSubmit={handleSubmit} style={{
      display: "flex", flexDirection: "column", gap: 8,
      padding: "12px 14px", background: "var(--clr-surface)",
      borderRadius: "var(--r-sm)", border: "1px solid var(--clr-primary)",
      marginTop: 4, marginLeft: editItem ? 0 : 8,
    }}>
      <input type="hidden" name="projetoId" value={projetoId} />
      <input type="hidden" name="parentId" value={parentId} />
      {editItem && <input type="hidden" name="id" value={editItem.id} />}

      {/* Linha 1: Nome, Tipo, Status */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input name="nome" className="form-input" placeholder="Nome do item *" required autoFocus
          defaultValue={editItem?.nome ?? ""} style={{ flex: "3 1 220px", minWidth: 0, ...inp }} />
        <select name="tipoItem" className="form-input form-select" value={tipoItem}
          onChange={(e) => setTipoItem(e.target.value)} style={{ width: 130, flexShrink: 0, ...inp }}>
          <option value="">Tipo</option>
          <option value="produto">Produto</option>
          <option value="servico">Serviço</option>
          <option value="composicao">Composição</option>
        </select>
        <select name="statusItem" className="form-input form-select"
          defaultValue={editItem?.statusItem ?? "para_aprovar"} style={{ width: 140, flexShrink: 0, ...inp }}>
          <option value="para_aprovar">Para aprovar</option>
          <option value="aprovado">Aprovado</option>
          <option value="nao_aprovado">Não aprovado</option>
        </select>
      </div>

      {/* Linha 2: dimensões + financeiro + classificação */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--clr-text-muted)" }}>Un.</span>
          <input name="unidade" className="form-input" placeholder="un"
            defaultValue={editItem?.unidade ?? ""} style={{ width: 52, ...inp }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--clr-text-muted)" }}>Qtd</span>
          <input name="quantidade" type="number" step="0.0001" min="0" className="form-input" placeholder="0"
            value={qtd} onChange={(e) => setQtd(e.target.value)} style={{ width: 80, ...inp }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--clr-text-muted)" }}>Custo un.</span>
          <input name="custoUnitario" type="number" step="0.01" min="0" className="form-input" placeholder="0,00"
            value={custo} onChange={(e) => setCusto(e.target.value)} style={{ width: 96, ...inp }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--clr-text-muted)" }}>BDI %</span>
          <input name="bdi" type="number" step="0.01" min="0" className="form-input" placeholder="0"
            value={bdi} onChange={(e) => setBDI(e.target.value)} style={{ width: 72, ...inp }} />
        </div>
        <select name="categoriaItemId" className="form-input form-select"
          defaultValue={editItem?.categoriaItem?.id ?? ""} style={{ flex: "2 1 130px", minWidth: 0, ...inp }}>
          <option value="">Categoria</option>
          {categoriasItem.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <input name="grupo" className="form-input" placeholder="Grupo / cômodo"
          defaultValue={editItem?.grupo ?? ""} style={{ flex: "1 1 100px", minWidth: 0, ...inp }} />
      </div>

      {/* Linha 3: preview + ações */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{
          fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700,
          color: precoPreview != null ? "var(--clr-success)" : "var(--clr-text-muted)",
        }}>
          {precoPreview != null
            ? `Preço total: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(precoPreview)}`
            : "Preencha custo, qtd e BDI para calcular"}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>Salvar</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={pending}>Cancelar</button>
        </div>
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
      gridTemplateColumns: ROW_COLS,
      gap: 4, padding: "4px 8px", fontSize: 10, fontWeight: 700,
      textTransform: "uppercase" as const, letterSpacing: "0.07em",
      color: "var(--clr-text-muted)", borderBottom: "2px solid var(--clr-border)", marginBottom: 2,
    }}>
      <span>N°</span>
      <span>Nome</span>
      <span>Grupo</span>
      <span style={{ textAlign: "center" }}>Un</span>
      <span style={{ textAlign: "right" }}>Qtd</span>
      <span style={{ textAlign: "right" }}>BDI</span>
      <span style={{ textAlign: "right" }}>Custo</span>
      <span style={{ textAlign: "right" }}>Preço</span>
      <span style={{ textAlign: "center" }}>Status</span>
      <span />
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
  const [search, setSearch] = useState("")
  const [grupoFilter, setGrupoFilter] = useState("")

  // Visualização
  const [viewMode, setViewMode] = useState<"lista" | "grupo" | "categoria" | "fornecedor">("lista")

  function byParent(parentId: string | null) {
    return items
      .filter((i) => i.parentId === parentId)
      .sort((a, b) => a.posicao - b.posicao || a.nome.localeCompare(b.nome))
  }

  function isVisible(item: Item) {
    if (search && !item.nome.toLowerCase().includes(search.toLowerCase())) return false
    if (tipoFilter && item.tipoItem !== tipoFilter) return false
    if (statusFilter && item.statusItem !== statusFilter) return false
    if (categoriaFilter && item.categoriaItem?.id !== categoriaFilter) return false
    if (fornecedorFilter && item.fornecedor?.id !== fornecedorFilter) return false
    if (grupoFilter && item.grupo !== grupoFilter) return false
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

  function buildNum(id: string): string {
    const item = items.find((i) => i.id === id)
    if (!item) return ""
    const siblings = items
      .filter((i) => i.parentId === item.parentId)
      .sort((a, b) => a.posicao - b.posicao || a.nome.localeCompare(b.nome))
    const idx = siblings.findIndex((s) => s.id === id) + 1
    if (!item.parentId) return String(idx)
    return `${buildNum(item.parentId)}.${idx}`
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
  const gruposDisponiveis = Array.from(new Set(composicoes.filter((i) => i.grupo).map((i) => i.grupo!))).sort()
  const activeFilters = [search, tipoFilter, statusFilter, categoriaFilter, fornecedorFilter, grupoFilter].filter(Boolean).length

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
                    num={buildNum(comp.id)}
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

  const chipStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 11, padding: "2px 8px", borderRadius: 12,
    background: "var(--clr-primary-alpha, rgba(99,102,241,.12))",
    color: "var(--clr-primary)", fontWeight: 600,
  }
  const chipBtnStyle: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--clr-primary)", fontSize: 13, lineHeight: 1, padding: "0 1px",
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
            + Nível
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

      {/* Barra de filtros — linha 1 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6, alignItems: "center" }}>
        {/* Visualizar por */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid var(--clr-border)", borderRadius: "var(--r-sm)", padding: "2px 8px", height: 28, background: "var(--clr-surface)", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--clr-text-muted)", whiteSpace: "nowrap" }}>Visualizar por:</span>
          <select className="form-select" value={viewMode}
            onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
            style={{ height: 22, fontSize: 11, border: "none", background: "transparent", padding: "0 2px", fontWeight: 600, color: "var(--clr-text)" }}>
            <option value="lista">Lista</option>
            <option value="grupo">Grupo</option>
            <option value="categoria">Categoria</option>
            <option value="fornecedor">Fornecedor</option>
          </select>
        </div>

        {/* Busca por nome */}
        <input
          type="search"
          className="form-input"
          placeholder="🔍 Pesquisar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ height: 28, fontSize: 11, flex: "1 1 160px", minWidth: 140 }}
        />

        {/* Tipo */}
        <select className="form-input form-select" value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          style={{ height: 28, fontSize: 11, width: 110, flexShrink: 0 }}>
          <option value="">Tipo</option>
          <option value="produto">Produto</option>
          <option value="servico">Serviço</option>
          <option value="composicao">Composição</option>
        </select>

        {/* Status */}
        <select className="form-input form-select" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ height: 28, fontSize: 11, width: 120, flexShrink: 0 }}>
          <option value="">Status</option>
          <option value="para_aprovar">Para aprovar</option>
          <option value="aprovado">Aprovado</option>
          <option value="nao_aprovado">Não aprovado</option>
        </select>

        {/* Grupos */}
        {gruposDisponiveis.length > 0 && (
          <select className="form-input form-select" value={grupoFilter}
            onChange={(e) => setGrupoFilter(e.target.value)}
            style={{ height: 28, fontSize: 11, width: 120, flexShrink: 0 }}>
            <option value="">Grupo</option>
            {gruposDisponiveis.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        )}

        {/* Categoria */}
        {categoriasItem.length > 0 && (
          <select className="form-input form-select" value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            style={{ height: 28, fontSize: 11, width: 130, flexShrink: 0 }}>
            <option value="">Categoria</option>
            {categoriasItem.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}

        {/* Fornecedor */}
        {fornecedoresDisponiveis.length > 0 && (
          <select className="form-input form-select" value={fornecedorFilter}
            onChange={(e) => setFornecedorFilter(e.target.value)}
            style={{ height: 28, fontSize: 11, width: 130, flexShrink: 0 }}>
            <option value="">Fornecedor</option>
            {fornecedoresDisponiveis.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        )}
      </div>

      {/* Chips de filtros ativos */}
      {activeFilters > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
          {search && (
            <span style={chipStyle}>
              Busca: &quot;{search}&quot;
              <button type="button" onClick={() => setSearch("")} style={chipBtnStyle}>×</button>
            </span>
          )}
          {tipoFilter && (
            <span style={chipStyle}>
              Tipo: {tipoItemLabel[tipoFilter] ?? tipoFilter}
              <button type="button" onClick={() => setTipoFilter("")} style={chipBtnStyle}>×</button>
            </span>
          )}
          {statusFilter && (
            <span style={chipStyle}>
              Status: {statusItemLabel[statusFilter] ?? statusFilter}
              <button type="button" onClick={() => setStatusFilter("")} style={chipBtnStyle}>×</button>
            </span>
          )}
          {grupoFilter && (
            <span style={chipStyle}>
              Grupo: {grupoFilter}
              <button type="button" onClick={() => setGrupoFilter("")} style={chipBtnStyle}>×</button>
            </span>
          )}
          {categoriaFilter && (
            <span style={chipStyle}>
              Categoria: {categoriasItem.find((c) => c.id === categoriaFilter)?.nome ?? categoriaFilter}
              <button type="button" onClick={() => setCategoriaFilter("")} style={chipBtnStyle}>×</button>
            </span>
          )}
          {fornecedorFilter && (
            <span style={chipStyle}>
              Fornecedor: {fornecedoresDisponiveis.find((f) => f.id === fornecedorFilter)?.nome ?? fornecedorFilter}
              <button type="button" onClick={() => setFornecedorFilter("")} style={chipBtnStyle}>×</button>
            </span>
          )}
          <button type="button"
            onClick={() => { setSearch(""); setTipoFilter(""); setStatusFilter(""); setCategoriaFilter(""); setFornecedorFilter(""); setGrupoFilter("") }}
            style={{ fontSize: 11, color: "var(--clr-text-muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}>
            Limpar todos
          </button>
        </div>
      )}

      {/* Add nível */}
      {showAddNivel && (
        <div style={{ marginBottom: 12 }}>
          <AddGrupoForm projetoId={projetoId} parentId={null}
            placeholder="Nome do nível (ex: 1. Demolições e Retiradas, 2. Estrutura)"
            actions={actions} onClose={() => setShowAddNivel(false)} />
        </div>
      )}

      {roots.length === 0 && !showAddNivel && (
        <div style={{ textAlign: "center", padding: "48px 16px" }}>
          <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>📋</div>
          <p style={{ color: "var(--clr-text-muted)", fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
            Adicione o primeiro nível para iniciar a construção do seu orçamento
          </p>
          <button type="button" className="btn btn-primary"
            onClick={() => { setShowAddNivel(true); closeAll() }}>
            + Novo Nível
          </button>
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
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--clr-text-muted)", flexShrink: 0, minWidth: 20 }}>
                    {buildNum(nivel.id)}
                  </span>
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
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--clr-text-muted)", flexShrink: 0, minWidth: 28 }}>
                          {buildNum(sub.id)}
                        </span>
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
                            key={comp.id} item={comp} num={buildNum(comp.id)}
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
                      key={comp.id} item={comp} num={buildNum(comp.id)}
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
