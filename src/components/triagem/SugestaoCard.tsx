"use client";

type Sugestao = { nome: string; telefone: string; narrativa: string };

interface SugestaoCardProps {
  sugestao: Sugestao;
  onChange: (s: Sugestao) => void;
  onAprovar: () => void;
  onCancelar: () => void;
  criando: boolean;
}

export function SugestaoCard({
  sugestao,
  onChange,
  onAprovar,
  onCancelar,
  criando,
}: SugestaoCardProps) {
  function set(field: keyof Sugestao, value: string) {
    onChange({ ...sugestao, [field]: value });
  }

  return (
    <div className="sugestao-card">
      <div className="sugestao-card-header">
        <div className="sugestao-card-badge">
          <span style={{ fontSize: 12 }}>✨</span>
          Sugerido pela Lia
        </div>
        <div className="sugestao-card-hint">Revise e edite antes de aprovar</div>
      </div>

      <div className="sugestao-card-body">
        <div className="sugestao-field">
          <label className="form-label" htmlFor="sugestao-nome">
            Nome do cliente
          </label>
          <input
            id="sugestao-nome"
            className="form-input"
            type="text"
            value={sugestao.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Nome não identificado"
            disabled={criando}
          />
        </div>

        <div className="sugestao-field">
          <label className="form-label" htmlFor="sugestao-telefone">
            Telefone
          </label>
          <input
            id="sugestao-telefone"
            className="form-input"
            type="tel"
            value={sugestao.telefone}
            onChange={(e) => set("telefone", e.target.value)}
            placeholder="Não identificado"
            disabled={criando}
          />
          <span className="form-hint">Apenas dígitos com DDD</span>
        </div>

        <div className="sugestao-field">
          <label className="form-label" htmlFor="sugestao-narrativa">
            O que o cliente quer
          </label>
          <textarea
            id="sugestao-narrativa"
            className="form-input form-textarea sugestao-narrativa-input"
            value={sugestao.narrativa}
            onChange={(e) => set("narrativa", e.target.value.slice(0, 200))}
            placeholder="Resumo do interesse do cliente"
            rows={4}
            disabled={criando}
          />
          <span className="form-hint">
            {sugestao.narrativa.length}/200 chars · será o título e descrição da oportunidade
          </span>
        </div>
      </div>

      <div className="sugestao-card-footer">
        <button
          className="btn btn-primary"
          onClick={onAprovar}
          disabled={criando || !sugestao.nome.trim()}
        >
          {criando ? (
            <>
              <span className="triagem-spinner" />
              Criando...
            </>
          ) : (
            <>
              <span style={{ fontSize: 15 }}>✓</span>
              Aprovar e Criar Oportunidade
            </>
          )}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancelar}
          disabled={criando}
        >
          Cancelar / Reanalisar
        </button>
      </div>
    </div>
  );
}
