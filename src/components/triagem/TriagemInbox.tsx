"use client";
import { useState } from "react";
import Link from "next/link";
import { analisarTexto } from "@/actions/ai/lia";
import { criarLeadDaTriagem } from "@/actions/ai/criarLeadDaTriagem";
import { SugestaoCard } from "./SugestaoCard";

type Sugestao = { nome: string; telefone: string; narrativa: string };

export function TriagemInbox() {
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [sugestao, setSugestao] = useState<Sugestao | null>(null);
  const [criando, setCriando] = useState(false);
  const [sucesso, setSucesso] = useState<{ projetoId: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleAnalisar() {
    if (!texto.trim()) return;
    setErro(null);
    setSugestao(null);
    setSucesso(null);
    setLoading(true);

    const result = await analisarTexto(texto);
    setLoading(false);

    if (!result.ok) {
      setErro(result.error);
      return;
    }
    setSugestao(result.data);
  }

  async function handleAprovar() {
    if (!sugestao) return;
    setErro(null);
    setCriando(true);

    const result = await criarLeadDaTriagem(sugestao);
    setCriando(false);

    if (!result.ok) {
      setErro(result.error);
      return;
    }
    setSucesso({ projetoId: result.projetoId });
  }

  function handleCancelar() {
    setSugestao(null);
    setErro(null);
  }

  function handleReiniciar() {
    setTexto("");
    setSugestao(null);
    setSucesso(null);
    setErro(null);
  }

  if (sucesso) {
    return (
      <div className="triagem-success-banner">
        <div className="triagem-success-icon">✓</div>
        <div className="triagem-success-content">
          <div className="triagem-success-title">Oportunidade criada com sucesso!</div>
          <div className="triagem-success-sub">
            A Lia registrou o lead e criou a oportunidade no funil.
          </div>
          <div className="triagem-success-actions">
            <Link
              href={`/dashboard/projetos/${sucesso.projetoId}`}
              className="btn btn-primary btn-sm"
            >
              Ver oportunidade
            </Link>
            <Link
              href="/dashboard/projetos?stage=oportunidade"
              className="btn btn-secondary btn-sm"
            >
              Ver todas as oportunidades
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={handleReiniciar}>
              Triagem nova
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="triagem-layout">
      {/* Coluna esquerda — entrada */}
      <div className="triagem-col-input">
        <div className="card card-pad">
          <div className="triagem-col-label">
            <span className="triagem-wpp-icon">💬</span>
            Cole a conversa do WhatsApp
          </div>
          <textarea
            className="form-input form-textarea triagem-whatsapp-input"
            placeholder={"[14:32] João Silva: Oi, vi no instagram de vocês...\n[14:33] Você: Oi João! Como posso ajudar?\n[14:33] João: Quero fazer uma reforma..."}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={16}
            disabled={loading}
          />
          <div className="triagem-input-footer">
            <span className="triagem-char-count">{texto.length} caracteres</span>
            <button
              className="btn btn-primary"
              onClick={handleAnalisar}
              disabled={loading || texto.trim().length < 10}
            >
              {loading ? (
                <>
                  <span className="triagem-spinner" />
                  Analisando...
                </>
              ) : (
                <>
                  <span style={{ fontSize: 16 }}>✨</span>
                  Analisar com IA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dica de uso */}
        {!sugestao && !erro && (
          <div className="triagem-hint-card">
            <div className="triagem-hint-title">Como usar</div>
            <ul className="triagem-hint-list">
              <li>Copie a conversa completa do WhatsApp Web ou do celular</li>
              <li>Cole no campo acima (funciona com qualquer formato)</li>
              <li>A Lia extrai nome, telefone e o que o cliente precisa</li>
              <li>Você revisa e aprova — só então o lead é criado</li>
            </ul>
          </div>
        )}
      </div>

      {/* Coluna direita — resultado */}
      <div className="triagem-col-result">
        {erro && (
          <div className="callout callout--danger">
            <span>⚠️</span>
            <span>{erro}</span>
          </div>
        )}

        {!sugestao && !erro && (
          <div className="triagem-empty-result">
            <div className="triagem-empty-icon">🤝</div>
            <div className="triagem-empty-title">Lia aguardando análise</div>
            <div className="triagem-empty-sub">
              Cole uma conversa e clique em "Analisar com IA"
            </div>
          </div>
        )}

        {sugestao && (
          <SugestaoCard
            sugestao={sugestao}
            onChange={setSugestao}
            onAprovar={handleAprovar}
            onCancelar={handleCancelar}
            criando={criando}
          />
        )}
      </div>
    </div>
  );
}
