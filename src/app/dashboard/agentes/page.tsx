import type { Metadata } from "next";
import Link from "next/link";
import { BotIcon, ArrowRightIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Agentes EVIS" };

const agentes = [
  {
    id: "lia",
    nome: "Lia",
    emoji: "🤝",
    avatarClass: "agent-avatar--lia",
    role: "Agente de Atendimento e Relacionamento",
    statusLabel: "Online",
    statusClass: "agent-status--online",
    descricao:
      "A Lia cuida do relacionamento com clientes e prospects. Ela registra interações, sugere follow-ups e mantém o histórico de conversas organizado para que nenhuma oportunidade se perca.",
    capacidades: ["Atendimento ao cliente", "Follow-up de oportunidades", "Registro de interações", "Sugestão de próximos passos"],
    acoes: ["Iniciar conversa", "Ver histórico"],
  },
  {
    id: "otto",
    nome: "Otto",
    emoji: "📋",
    avatarClass: "agent-avatar--otto",
    role: "Agente de Orçamentos e Documentação",
    statusLabel: "Online",
    statusClass: "agent-status--online",
    descricao:
      "Otto auxilia na montagem de orçamentos, revisão de documentos e organização de propostas. Ele conhece os padrões SINAPI e BDI e vai te ajudar a montar planilhas e composições de custo.",
    capacidades: ["Orçamentos preliminares", "Composições de custo", "Revisão de documentos", "Propostas técnicas"],
    acoes: ["Pedir orçamento", "Ver documentos"],
  },
  {
    id: "evandro-ia",
    nome: "Evandro IA",
    emoji: "🧠",
    avatarClass: "agent-avatar--evandro",
    role: "Agente Orquestrador e Mentor Técnico",
    statusLabel: "Online",
    statusClass: "agent-status--online",
    descricao:
      "O Evandro IA é o orquestrador principal do sistema. Ele coordena os demais agentes, valida decisões, protege contra alucinação e transforma visão em estrutura executável. É o espelho técnico do fundador.",
    capacidades: ["Orquestração de agentes", "Validação de decisões", "Planejamento estratégico", "Anti-alucinação"],
    acoes: ["Conversar", "Ver decisões"],
  },
  {
    id: "sentinela",
    nome: "Sentinela",
    emoji: "🛡️",
    avatarClass: "agent-avatar--sentinela",
    role: "Agente de Monitoramento e Risco",
    statusLabel: "Monitorando",
    statusClass: "agent-status--online",
    descricao:
      "O Sentinela monitora os indicadores das obras, identifica riscos antecipadamente e gera alertas. Ele acompanha prazos, financeiro e tarefas críticas para que nenhum problema passe despercebido.",
    capacidades: ["Monitoramento de obras", "Identificação de riscos", "Alertas proativos", "Análise de indicadores"],
    acoes: ["Ver alertas", "Ver obras monitoradas"],
  },
];

export default function AgentesPage() {
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Agentes EVIS</h1>
            <p className="page-subtitle">
              4 agentes operando na sua empresa — cada um com função específica.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "var(--clr-success-bg)",
              color: "var(--clr-success)",
              border: "1px solid #bbf7d0",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
            Todos online
          </div>
        </div>
      </div>

      {/* Banner informativo */}
      <div className="callout callout--info" style={{ marginBottom: 28 }}>
        <span style={{ flexShrink: 0, marginTop: 2, display: "flex" }}><BotIcon size={16} /></span>
        <span>
          Os agentes EVIS operam de forma integrada. A integração com IA real está em desenvolvimento —
          por enquanto, cada agente mostra sua função e capacidades planejadas.
          {" "}<Link href="/dashboard">Voltar ao dashboard</Link>
        </span>
      </div>

      {/* Grid de agentes */}
      <div className="agents-grid">
        {agentes.map((ag) => (
          <div key={ag.id} className="agent-card">
            <div className="agent-card-header">
              <div className={`agent-avatar ${ag.avatarClass}`}>
                <span style={{ fontSize: 22 }}>{ag.emoji}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="agent-name">{ag.nome}</div>
                <div className="agent-role">{ag.role}</div>
              </div>
              <div className={`agent-status ${ag.statusClass}`}>
                <span className="agent-status-dot" />
                {ag.statusLabel}
              </div>
            </div>

            <p className="agent-desc">{ag.descricao}</p>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--clr-text-muted)", marginBottom: 6 }}>
                Capacidades
              </div>
              <div className="agent-capabilities">
                {ag.capacidades.map((cap) => (
                  <span key={cap} className="agent-cap">{cap}</span>
                ))}
              </div>
            </div>

            <div className="agent-actions">
              <button
                disabled
                className="btn btn-primary btn-sm"
                title="IA real em desenvolvimento"
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              >
                Conversar (em breve)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Seção: Como os agentes operam */}
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div className="card-title">Como os agentes operam juntos</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {[
            {
              emoji: "1️⃣",
              titulo: "Você traz a visão",
              desc: "Você define o que precisa — uma obra, uma proposta, um problema. O Evandro IA estrutura e delega.",
            },
            {
              emoji: "2️⃣",
              titulo: "Agentes especializados executam",
              desc: "Lia atende clientes. Otto monta orçamentos. Sentinela monitora riscos. Cada um no seu domínio.",
            },
            {
              emoji: "3️⃣",
              titulo: "Você valida e decide",
              desc: "Nada avança sem sua aprovação. O HITL (Human-in-the-Loop) é um princípio central do EVIS.",
            },
            {
              emoji: "4️⃣",
              titulo: "Rastreio automático",
              desc: "Toda ação dos agentes fica registrada no histórico imutável. Auditoria completa a qualquer momento.",
            },
          ].map((item) => (
            <div key={item.titulo} style={{ padding: "16px", background: "#f8fafc", borderRadius: "var(--r-md)", border: "1px solid var(--clr-border)" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{item.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>{item.titulo}</div>
              <div style={{ fontSize: 13, color: "var(--clr-text-secondary)", lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Atalhos */}
      <div className="section-grid">
        <div className="card card-pad">
          <div className="card-title">Explorar o produto</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            <Link href="/dashboard/projetos" style={{ fontSize: 14, color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <ArrowRightIcon size={13} /> Ver projetos e obras
            </Link>
            <Link href="/dashboard/clientes" style={{ fontSize: 14, color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <ArrowRightIcon size={13} /> Ver clientes
            </Link>
            <Link href="/dashboard/fornecedores" style={{ fontSize: 14, color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <ArrowRightIcon size={13} /> Ver fornecedores
            </Link>
          </div>
        </div>
        <div className="card card-pad">
          <div className="card-title">Roteiro de lançamento</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4, fontSize: 13, color: "var(--clr-text-secondary)", lineHeight: 1.7 }}>
            <span>✅ Cadastro de empresa e login Google</span>
            <span>✅ Projetos e obras funcionando</span>
            <span>✅ Clientes e fornecedores</span>
            <span>🔜 IA real conectada aos agentes</span>
            <span>🔜 Orçamentos e financeiro completo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
