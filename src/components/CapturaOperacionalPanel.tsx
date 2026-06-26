"use client";

import { useRef, useState } from "react";
import { preencherOportunidadeComAgente } from "@/actions/ai/preencherOportunidade";
import { AgentsIcon } from "@/components/Icons";

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = new Set(["image/png", "image/jpeg", "image/webp"]);

interface Props {
  stage: string;
  agenteFilled?: string;
  erro?: string;
  pendencias?: string;
  tarefas?: string;
  semDestino?: string;
}

export default function CapturaOperacionalPanel({
  stage, agenteFilled, erro, pendencias, tarefas, semDestino,
}: Props) {
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<File[]>([]);

  function syncInput(files: File[]) {
    filesRef.current = files;
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    inputRef.current.files = dt.files;
  }

  function add(novos: File[]) {
    const ok = novos.filter((f) => ACCEPT.has(f.type) && f.size <= MAX_BYTES);
    const merged = [...filesRef.current, ...ok].slice(0, MAX_FILES);
    syncInput(merged);
    setArquivos([...merged]);
  }

  function remove(i: number) {
    const next = filesRef.current.filter((_, j) => j !== i);
    syncInput(next);
    setArquivos([...next]);
  }

  return (
    <div style={{
      background: "var(--clr-surface)",
      border: "1px solid var(--clr-border)",
      borderRadius: "var(--r-lg)",
      padding: "20px 24px",
      marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <AgentsIcon size={15} style={{ color: "var(--clr-primary)" }} />
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--clr-primary)",
        }}>
          Captura Operacional
        </span>
      </div>
      <p style={{ fontSize: 13, color: "var(--clr-text-muted)", marginBottom: 16 }}>
        Cole uma conversa, mensagem ou relato, ou arraste/cole imagens. O agente preenche os campos — você revisa antes de salvar.
      </p>

      {/* Banner de erro */}
      {erro && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "var(--r-md)",
          padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#991b1b",
        }}>
          {decodeURIComponent(erro)}
        </div>
      )}

      {/* Banner de sucesso */}
      {agenteFilled === "1" && !erro && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "var(--r-md)",
          padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#166534",
        }}>
          Campos preenchidos pelo agente. Revise, edite se necessário e salve.
          {pendencias && (
            <div style={{ marginTop: 6, color: "#854d0e", fontWeight: 500 }}>
              Pendências: {pendencias}
            </div>
          )}
          {tarefas && (
            <div style={{ marginTop: 6, color: "#14532d", fontWeight: 500 }}>
              Ações sugeridas: {tarefas}
            </div>
          )}
          {semDestino && (
            <div style={{ marginTop: 6, color: "#475569", fontWeight: 500 }}>
              Sem destino estruturado atual: {semDestino}
            </div>
          )}
        </div>
      )}

      <form action={preencherOportunidadeComAgente} encType="multipart/form-data">
        <input type="hidden" name="stage" value={stage} />

        <textarea
          name="texto_captura"
          className="form-input form-textarea"
          placeholder="Cole aqui uma conversa de WhatsApp, mensagem, relato de visita ou qualquer texto com informações do lead..."
          rows={4}
          style={{ marginBottom: 10, resize: "vertical" }}
          onPaste={(e) => {
            const items = Array.from(e.clipboardData.items);
            const imgs = items
              .filter((it) => it.kind === "file" && ACCEPT.has(it.type))
              .map((it) => it.getAsFile())
              .filter(Boolean) as File[];
            if (imgs.length > 0) {
              e.preventDefault();
              add(imgs);
            }
          }}
        />

        {/* Zona de drop */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Área de imagens — arraste, cole ou clique para selecionar"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); add(Array.from(e.dataTransfer.files)); }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          style={{
            border: `2px dashed ${dragging ? "var(--clr-primary)" : "var(--clr-border)"}`,
            borderRadius: "var(--r-md)",
            background: dragging ? "rgba(99,102,241,0.04)" : "var(--clr-bg)",
            padding: arquivos.length ? "10px 14px" : "20px 14px",
            cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s",
            marginBottom: 10,
            userSelect: "none",
          }}
        >
          {arquivos.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--clr-text-muted)", textAlign: "center", margin: 0 }}>
              Arraste imagens aqui, cole (Ctrl+V) ou clique para selecionar
              <br />
              <span style={{ fontSize: 11 }}>PNG, JPG, WebP · até 5 MB por imagem · máximo {MAX_FILES} imagens</span>
            </p>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {arquivos.map((f, i) => (
                <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, display: "block" }}
                  />
                  <button
                    type="button"
                    aria-label={`Remover ${f.name}`}
                    onClick={(ev) => { ev.stopPropagation(); remove(i); }}
                    style={{
                      position: "absolute", top: -6, right: -6,
                      width: 18, height: 18, borderRadius: "50%",
                      background: "#ef4444", color: "#fff",
                      border: "none", cursor: "pointer", fontSize: 12,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1, padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {arquivos.length < MAX_FILES && (
                <div style={{
                  width: 56, height: 56, border: "2px dashed var(--clr-border)",
                  borderRadius: 6, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 22, color: "var(--clr-text-muted)",
                }}>
                  +
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input oculto — controlado via DataTransfer */}
        <input
          ref={inputRef}
          type="file"
          name="imagem_captura"
          multiple
          accept="image/png,image/jpeg,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            e.target.value = "";
            if (files.length > 0) add(files);
          }}
        />

        <button
          type="submit"
          className="btn btn-secondary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <AgentsIcon size={13} />
          Preencher campos com agente
        </button>
      </form>
    </div>
  );
}
