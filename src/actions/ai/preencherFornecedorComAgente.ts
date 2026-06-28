"use server";

import { redirect } from "next/navigation";
import { createPartFromBase64, GoogleGenAI, type Part } from "@google/genai";
import { pickGeminiKey } from "@/lib/gemini";

const SYSTEM_PROMPT = `Você é o assistente operacional do EVIS, sistema de gestão para construtoras.

Analise a entrada abaixo (texto, conversa, cartão de visita, print, nota fiscal, catálogo, e-mail ou imagem) e extraia as informações para cadastrar um novo fornecedor ou prestador de serviço.

Você não cria uma jornada nova. Você opera o formulário manual existente de Novo Fornecedor. Onde houver campo, preencha. Onde não houver, registre como pendência.

Regras obrigatórias:
- Não invente. Extraia só o que está explícito ou fortemente implícito.
- Se houver imagem, faça leitura visual/OCR e extraia os dados visíveis.
- nome: nome fantasia ou nome comercial do fornecedor.
- razaoSocial: nome empresarial conforme CNPJ (somente PJ).
- tipoPessoa: PF para autônomo/pessoa física, PJ para empresa. Se houver CNPJ, é PJ.
- cpfCnpj: somente dígitos ou formato padrão.
- tipo: use servico para prestador de serviço, material para fornecedor de material, ambos se os dois. Default: servico.
- telefone: com DDD, somente dígitos.
- categorias: lista separada por vírgula dos tipos de serviço ou material fornecido. Ex: elétrica, hidráulica, pintura.
- nomeResponsavel: nome do dono ou responsável pela empresa.
- nomeContato: nome de quem atende pedidos/compras (pode ser diferente do responsável).
- site: URL completa se mencionada.
- pendencias: liste o que faltou e precisa ser confirmado antes de salvar.`;

interface ExtracaoFornecedor {
  nome: string;
  razaoSocial: string;
  tipoPessoa: string;
  cpfCnpj: string;
  tipo: string;
  telefone: string;
  email: string;
  site: string;
  nomeResponsavel: string;
  nomeContato: string;
  categorias: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
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
    razaoSocial: { type: "string" },
    tipoPessoa: { type: "string" },
    cpfCnpj: { type: "string" },
    tipo: { type: "string" },
    telefone: { type: "string" },
    email: { type: "string" },
    site: { type: "string" },
    nomeResponsavel: { type: "string" },
    nomeContato: { type: "string" },
    categorias: { type: "string" },
    cep: { type: "string" },
    rua: { type: "string" },
    numero: { type: "string" },
    complemento: { type: "string" },
    bairro: { type: "string" },
    cidade: { type: "string" },
    estado: { type: "string" },
    pendencias: { type: "array", items: { type: "string" } },
  },
  required: [
    "nome", "razaoSocial", "tipoPessoa", "cpfCnpj", "tipo", "telefone",
    "email", "site", "nomeResponsavel", "nomeContato", "categorias",
    "cep", "rua", "numero", "complemento", "bairro", "cidade", "estado", "pendencias",
  ],
  propertyOrdering: [
    "nome", "razaoSocial", "tipoPessoa", "cpfCnpj", "tipo",
    "telefone", "email", "site", "nomeResponsavel", "nomeContato", "categorias",
    "cep", "rua", "numero", "complemento", "bairro", "cidade", "estado", "pendencias",
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
  if (msg.includes("PERMISSION_DENIED") || msg.includes("UNAUTHENTICATED")) return "Falha de autenticação. Verifique a GEMINI_API_KEY.";
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

export async function preencherFornecedorComAgente(formData: FormData) {
  const texto = ((formData.get("texto_captura") as string) ?? "").trim();
  const imagemFiles = (formData.getAll("imagem_captura") as File[]).filter(
    (f) => f instanceof File && f.size > 0,
  );
  const base = "/dashboard/fornecedores/novo";

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

    const data = JSON.parse(raw) as ExtracaoFornecedor;
    const p = new URLSearchParams();
    p.set("agenteFilled", "1");
    setIf(p, "nome", data.nome);
    setIf(p, "razaoSocial", data.razaoSocial);
    setIf(p, "tipoPessoa", data.tipoPessoa);
    setIf(p, "cpfCnpj", data.cpfCnpj);
    setIf(p, "tipo", data.tipo);
    setIf(p, "telefone", data.telefone);
    setIf(p, "email", data.email);
    setIf(p, "site", data.site);
    setIf(p, "nomeResponsavel", data.nomeResponsavel);
    setIf(p, "nomeContato", data.nomeContato);
    setIf(p, "categorias", data.categorias);
    setIf(p, "cep", data.cep);
    setIf(p, "rua", data.rua);
    setIf(p, "numero", data.numero);
    setIf(p, "complemento", data.complemento);
    setIf(p, "bairro", data.bairro);
    setIf(p, "cidade", data.cidade);
    setIf(p, "estado", data.estado);
    if (data.pendencias?.length > 0) p.set("pendencias", data.pendencias.join(" · "));
    redirectTo = `${base}?${p.toString()}`;
  } catch (error) {
    console.error("[CapturaFornecedor]", error);
    redirect(`${base}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
  redirect(redirectTo);
}
