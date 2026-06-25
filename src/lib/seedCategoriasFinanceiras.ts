import { prisma } from "@/lib/prisma"

type Row = {
  numero: string
  nome: string
  tipo: string
  grupoDRE: string | null
  parentNumero: string | null
}

const DEFAULTS: Row[] = [
  // ── RECEITA (fonte: categorias_financeiras.csv — completo) ──
  { numero: "1",   nome: "Outras Receitas e Entradas",                            tipo: "receita",  grupoDRE: null,                                parentNumero: null },
  { numero: "1.1", nome: "Adiantamentos para futuros aumentos de Capital - AFAC", tipo: "receita",  grupoDRE: null,                                parentNumero: "1"  },
  { numero: "1.2", nome: "Empréstimos de Bancos",                                 tipo: "receita",  grupoDRE: null,                                parentNumero: "1"  },
  { numero: "1.3", nome: "Empréstimos de Instituições",                           tipo: "receita",  grupoDRE: null,                                parentNumero: "1"  },
  { numero: "1.4", nome: "Empréstimos de Sócios",                                 tipo: "receita",  grupoDRE: null,                                parentNumero: "1"  },
  { numero: "1.5", nome: "Integralização de Capital Social",                      tipo: "receita",  grupoDRE: null,                                parentNumero: "1"  },
  { numero: "1.6", nome: "Outros",                                                tipo: "receita",  grupoDRE: null,                                parentNumero: "1"  },
  { numero: "2",   nome: "Receita de Vendas",                                     tipo: "receita",  grupoDRE: null,                                parentNumero: null },
  { numero: "2.1", nome: "Administração e Gerenciamento de Materiais",            tipo: "receita",  grupoDRE: "Receita de vendas de serviços",      parentNumero: "2"  },
  { numero: "2.2", nome: "Comissão",                                              tipo: "receita",  grupoDRE: "Receita de vendas de serviços",      parentNumero: "2"  },
  { numero: "2.3", nome: "Venda de Produtos",                                     tipo: "receita",  grupoDRE: "Receita de vendas de produtos",      parentNumero: "2"  },
  { numero: "2.4", nome: "Venda de Serviços",                                     tipo: "receita",  grupoDRE: "Receita de vendas de serviços",      parentNumero: "2"  },
  { numero: "3",   nome: "Receitas financeiras",                                  tipo: "receita",  grupoDRE: null,                                parentNumero: null },
  { numero: "3.1", nome: "Multa",                                                 tipo: "receita",  grupoDRE: "Receitas e rendimentos financeiros", parentNumero: "3"  },
  { numero: "3.2", nome: "Reembolso de Material",                                 tipo: "receita",  grupoDRE: null,                                parentNumero: "3"  },
  { numero: "3.3", nome: "Rendimentos de Aplicações",                             tipo: "receita",  grupoDRE: "Receitas e rendimentos financeiros", parentNumero: "3"  },
  // ── DESPESA — Grupo 1 (fonte: print VOBI validado — parcial) ──
  { numero: "1",    nome: "Bens Imobilizados da Empresa",                          tipo: "despesa",  grupoDRE: null,                                parentNumero: null },
  { numero: "1.1",  nome: "Benfeitorias em Bens de Terceiros",                     tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.2",  nome: "Computadores e Periféricos",                            tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.3",  nome: "Construções em Andamento - Imóvel Próprio",             tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.4",  nome: "Edifícios e Construções",                               tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.5",  nome: "Leasing - Imóveis",                                     tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.6",  nome: "Leasing - Máquinas, Equipamentos e Instalações",       tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.7",  nome: "Leasing - Móveis, Utensílios e Instalações Admin.",    tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.8",  nome: "Leasing - Móveis, Utensílios e Instalações Comerciais",tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.9",  nome: "Leasing - Outras Imobilizações",                        tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.10", nome: "Leasing - Veículos",                                    tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.11", nome: "Máquinas, Equipamentos e Instalações Industriais",      tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.12", nome: "Móveis, Utensílios e Instalações Administrativos",      tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.13", nome: "Móveis, Utensílios e Instalações Comerciais",           tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.14", nome: "Outras Imobilizações por Aquisição",                    tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
  { numero: "1.15", nome: "Software / Licença de Uso",                             tipo: "despesa",  grupoDRE: "Investimentos em imobilizado",       parentNumero: "1"  },
]

export async function seedCategoriasFinanceiras(empresaId: string) {
  const existing = await prisma.categoriaFinanceira.count({ where: { empresaId } })
  if (existing > 0) return { skipped: true, count: existing }

  const parents = DEFAULTS.filter((r) => r.parentNumero === null)
  const children = DEFAULTS.filter((r) => r.parentNumero !== null)

  const idMap: Record<string, string> = {}

  for (const p of parents) {
    const key = `${p.tipo}:${p.numero}`
    const created = await prisma.categoriaFinanceira.create({
      data: { empresaId, numero: p.numero, nome: p.nome, tipo: p.tipo, grupoDRE: p.grupoDRE },
    })
    idMap[key] = created.id
  }

  for (const c of children) {
    const parentKey = `${c.tipo}:${c.parentNumero}`
    await prisma.categoriaFinanceira.create({
      data: {
        empresaId,
        numero: c.numero,
        nome: c.nome,
        tipo: c.tipo,
        grupoDRE: c.grupoDRE,
        parentId: idMap[parentKey] ?? null,
      },
    })
  }

  return { skipped: false, count: DEFAULTS.length }
}
