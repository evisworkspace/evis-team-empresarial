"use server";

import { redirect } from "next/navigation";
import { createPartFromBase64, GoogleGenAI, type Part } from "@google/genai";
import { pickGeminiKey } from "@/lib/gemini";

const SYSTEM_PROMPT = `Você é o assistente operacional do EVIS, sistema de gestão para construtoras.

Analise a entrada abaixo (texto, conversa, cartão de visita, print, documento, imagem ou narração) e extraia as informações para cadastrar um novo cliente ou lead.

Você não cria uma jornada nova. Você opera o formulário manual existente de Novo Cliente. Onde houver campo, preencha. Onde não houver, registre como pendência.

Regras obrigatórias:
- Não invente. Extraia só o que está explícito ou fortemente implícito.
- Se houver imagem, faça leitura visual/OCR e extraia os dados visíveis.
- Se um campo não puder ser determinado com confiança, use string vazia.
- tipoPessoa: use PF para pessoa física, PJ para pessoa jurídica. Se houver CNPJ, é PJ. Se houver CPF, é PF. Se dúvida, deixe vazio.
- origemContato: use indicacao | google_organico | midias_sociais | anuncios_pagos | outros — ou vazio. WhatsApp sem contexto de indicação → outros.
- nome: nome completo da pessoa ou nome fantasia da empresa.
- razaoSocial: somente para PJ — nome empresarial conforme CNPJ.
- cpfCnpj: somente dígitos ou formato padrão brasileiro.
- telefone: com DDD, somente dígitos.
- dataNascimento: YYYY-MM-DD. Somente se explicitamente mencionada.
- pendencias: liste o que faltou e precisa ser confirmado antes de salvar.`;

interface ExtracaoCliente {
  nome: string;
  tipoPessoa: string;
  telefone: string;
  email: string;
  cpfCnpj: string;
  origemContato: string;
  razaoSocial: string;
  rg: string;
  dataNascimento: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
  pendencias: string[];
}

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const GEMINI_MODEL_PRIMARY =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_MODEL_FALLBACK = "gemini-2.0-flash";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    nome: { type: "string" },
    tipoPessoa: { type: "string" },
    telefone: { type: "string" },
    email: { type: "string" },
    cpfCnpj: { type: "string" },
    origemContato: { type: "string" },
    razaoSocial: { type: "string" },
    rg: { type: "string" },
    dataNascimento: { type: "string" },
    cep: { type: "string" },
    rua: { type: "string" },
    numero: { type: "string" },
    complemento: { type: "string" },
    bairro: { type: "string" },
    cidade: { type: "string" },
    estado: { type: "string" },
    observacoes: { type: "string" },
    pendencias: { type: "array", items: { type: "string" } },
  },
  required: [
    "nome", "tipoPessoa", "telefone", "email", "cpfCnpj", "origemContato",
    "razaoSocial", "rg", "dataNascimento", "cep", "rua", "numero",
    "complemento", "bairro", "cidade", "estado", "observacoes", "pendencias",
  ],
  propertyOrdering: [
    "nome", "tipoPessoa", "telefone", "email", "cpfCnpj", "origemContato",
    "razaoSocial", "rg", "dataNascimento",
    "cep", "rua", "numero", "complemento", "bairro", "cidade", "estado",
    "observacoes", "pendencias",
  ],
};

function setIf(params: URLSearchParams, key: string, value: string | undefined) {
  const clean = value?.trim();
  if (clean) params.set(key, clean);
}

function isUnavailable(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("503") || msg.includes("UNAVAILABLE");
}

function errorMessage(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) return "Limite da API Gemini atingido. Tente novamente.";
  if (msg.includes("PERMISSION_DENIED") || msg.includes("UNAUTHENTICATED")) return "Falha de autenticação no Gemini. Verifique a GEMINI_API_KEY.";
  if (msg.includes("UNAVAILABLE") || msg.includes("503")) return "Gemini indisponível. Tente novamente.";
  return "Erro na análise. Tente novamente.";
}

async function chamarGemini(ai: GoogleGenAI, parts: Part[], model: string) {
  return ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });
}

export async function preencherClienteComAgente(formData: FormData) {
  const texto = ((formData.get("texto_captura") as string) ?? "").trim();
  const imagemFiles = (formData.getAll("imagem_captura") as File[]).filter(
    (f) => f instanceof File && f.size > 0,
  );
  const base = "/dashboard/clientes/novo";

  if ((!texto || texto.length < 10) && imagemFiles.length === 0) {
    redirect(`${base}?erro=${encodeURIComponent("Informe um texto ou anexe uma imagem para análise.")}`);
  }

  for (const f of imagemFiles) {
    if (!IMAGE_MIME_TYPES.has(f.type)) redirect(`${base}?erro=${encodeURIComponent("Formato não suportado. Use PNG, JPG ou WebP.")}`);
    if (f.size > IMAGE_MAX_BYTES) redirect(`${base}?erro=${encodeURIComponent("Imagem muito grande. Até 5 MB cada.")}`);
  }

  const apiKey = pickGeminiKey();
  if (!apiKey) redirect(`${base}?erro=${encodeURIComponent("API Gemini não configurada.")}`);

  let redirectTo = base;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const parts: Part[] = [];
    if (texto) parts.push({ text: `Entrada fornecida:\n${texto}` });
    for (const img of imagemFiles) {
      const bytes = Buffer.from(await img.arrayBuffer());
      parts.push(createPartFromBase64(bytes.toString("base64"), img.type));
    }

    let response;
    try {
      response = await chamarGemini(ai, parts, GEMINI_MODEL_PRIMARY);
    } catch (e) {
      if (isUnavailable(e)) response = await chamarGemini(ai, parts, GEMINI_MODEL_FALLBACK);
      else throw e;
    }

    const raw = response.text?.trim();
    if (!raw) throw new Error("empty response");

    const data = JSON.parse(raw) as ExtracaoCliente;
    const p = new URLSearchParams();
    p.set("agenteFilled", "1");
    setIf(p, "nome", data.nome);
    setIf(p, "tipoPessoa", data.tipoPessoa);
    setIf(p, "telefone", data.telefone);
    setIf(p, "email", data.email);
    setIf(p, "cpfCnpj", data.cpfCnpj);
    setIf(p, "origemContato", data.origemContato);
    setIf(p, "razaoSocial", data.razaoSocial);
    setIf(p, "rg", data.rg);
    setIf(p, "dataNascimento", data.dataNascimento);
    setIf(p, "cep", data.cep);
    setIf(p, "rua", data.rua);
    setIf(p, "numero", data.numero);
    setIf(p, "complemento", data.complemento);
    setIf(p, "bairro", data.bairro);
    setIf(p, "cidade", data.cidade);
    setIf(p, "estado", data.estado);
    setIf(p, "observacoes", data.observacoes?.slice(0, 800));
    if (data.pendencias?.length > 0) p.set("pendencias", data.pendencias.join(" · "));
    redirectTo = `${base}?${p.toString()}`;
  } catch (error) {
    console.error("[CapturaCliente]", error);
    redirect(`${base}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
  redirect(redirectTo);
}
