export type StatusConfig = {
  label: string
  cor: string
  grupo: "ativo" | "fechado"
}

export const STATUS_OPORTUNIDADE: Record<string, StatusConfig> = {
  novo:             { label: "Agendar Visita",   cor: "#0ea5e9", grupo: "ativo" },
  fila_espera:      { label: "Fila Espera",      cor: "#7c3aed", grupo: "ativo" },
  em_andamento:     { label: "Em andamento",     cor: "#059669", grupo: "ativo" },
  proposta_enviada: { label: "Proposta enviada", cor: "#d97706", grupo: "ativo" },
  em_negociacao:    { label: "Em negociação",    cor: "#dc2626", grupo: "ativo" },
  ganho:            { label: "Ganho",            cor: "#10b981", grupo: "fechado" },
  perdido:          { label: "Arquivado",        cor: "#6b7280", grupo: "fechado" },
}

export const STATUS_OBRA: Record<string, StatusConfig> = {
  abertura:     { label: "Abertura",     cor: "#3b82f6", grupo: "ativo" },
  planejamento: { label: "Planejamento", cor: "#8b5cf6", grupo: "ativo" },
  em_andamento: { label: "Em andamento", cor: "#f97316", grupo: "ativo" },
  pausada:      { label: "Pausada",      cor: "#eab308", grupo: "ativo" },
  concluida:    { label: "Concluída",    cor: "#10b981", grupo: "fechado" },
  entregue:     { label: "Entregue",     cor: "#64748b", grupo: "fechado" },
  encerrada:    { label: "Encerrada",    cor: "#ef4444", grupo: "fechado" },
}

export const STATUS_PROJETO: Record<string, StatusConfig> = {
  ...STATUS_OPORTUNIDADE,
  ...STATUS_OBRA,
}

export function getStatusConfig(statusInterno: string | null | undefined): StatusConfig {
  return STATUS_PROJETO[statusInterno ?? ""] ?? { label: statusInterno ?? "—", cor: "#6b7280", grupo: "ativo" }
}

export function getStatusConfigForStage(statusInterno: string | null | undefined, stage: string): StatusConfig {
  const map = stage === "obra" ? STATUS_OBRA : STATUS_OPORTUNIDADE
  return map[statusInterno ?? ""] ?? STATUS_PROJETO[statusInterno ?? ""] ?? { label: statusInterno ?? "—", cor: "#6b7280", grupo: "ativo" }
}
