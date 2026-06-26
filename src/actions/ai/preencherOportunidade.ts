"use server";

import { redirect } from "next/navigation";
import { createPartFromBase64, GoogleGenAI, type Part } from "@google/genai";

const SYSTEM_PROMPT = `Você é o assistente operacional do EVIS, sistema de gestão para construtoras.

Analise a entrada abaixo (texto, conversa, relato, print, imagem de WhatsApp, captura de plataforma ou narração) e extraia as informações para criar uma nova oportunidade comercial.

Você não cria uma jornada nova. Você opera o formulário manual existente de Nova Oportunidade. Onde houver campo no sistema, preencha. Onde não houver campo, registre como pendência ou item sem destino estruturado.

Regras obrigatórias:
- Não invente informações. Extraia só o que está explícito ou fortemente implícito no texto.
- Se houver imagem, faça leitura visual/OCR da imagem e extraia os dados visíveis nela.
- Se um campo não puder ser determinado com confiança, use string vazia ou 0.
- tipoObra: use apenas residencial | comercial | industrial | reforma | outro — ou string vazia.
- origem: use apenas indicacao | google_organico | midias_sociais | anuncios_pagos | outros — ou string vazia. WhatsApp, plataforma, ligação e origem não mapeada viram "outros". Indicação explícita vira "indicacao".
- prioridade: use apenas baixa | media | alta | urgente — ou string vazia. Urgente se houver prazo imediato.
- statusInicial: use apenas novo | fila_espera | em_andamento | proposta_enviada | em_negociacao | ganho | perdido — normalmente use "novo". Se houver visita a agendar ou visita agendada, ainda use "novo", pois no EVIS esse status aparece como Agendar Visita.
- dataInicioEstimada: use formato YYYY-MM-DD. Se houver data sem ano, assuma 2026.
- pendencias: liste em português o que faltou na entrada e precisa ser confirmado pelo usuário antes de salvar. Ex: "Endereço da obra não mencionado", "Prazo não definido".
- tarefasSugeridas: liste ações operacionais percebidas, sem executar. Ex: "Confirmar visita com Ricardo", "Solicitar projeto executivo".
- itensSemDestino: liste informações detectadas que ainda não têm módulo estruturado. Ex: "Documentos de projeto para futura aba Arquivos".
- titulo: nome curto e objetivo para identificar a oportunidade. Ex: "Reforma Apartamento — Pedro", "Construção Residência Silva".
- descricao: narrativa completa preservando o contexto original. Pode ser longa.
- Endereço: se o texto trouxer endereço completo, separe em cep, logradouro, número, complemento, bairro, cidade e estado quando possível.`;

interface ExtracaoOportunidade {
  titulo: string;
  descricao: string;
  tipoObra: string;
  origem: string;
  prioridade: string;
  statusInicial: string;
  dataInicioEstimada: string;
  metragemEstimada: number;
  valorEstimado: number;
  valorGanhoEstimativa: number;
  cepObra: string;
  logradouroObra: string;
  numeroEnderecoObra: string;
  complementoObra: string;
  bairroObra: string;
  cidadeObra: string;
  estadoObra: string;
  clienteNome: string;
  clienteTelefone: string;
  pendencias: string[];
  tarefasSugeridas: string[];
  itensSemDestino: string[];
}

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function setIf(params: URLSearchParams, key: string, value: string | number | undefined) {
  if (typeof value === "number") {
    if (Number.isFinite(value) && value > 0) params.set(key, String(value));
    return;
  }

  const clean = value?.trim();
  if (clean) params.set(key, clean);
}

export async function preencherOportunidadeComAgente(formData: FormData) {
  const texto = ((formData.get("texto_captura") as string) ?? "").trim();
  const imagem = formData.get("imagem_captura");
  const imagemFile = imagem instanceof File && imagem.size > 0 ? imagem : null;
  const stage = (formData.get("stage") as string) || "oportunidade";
  const base = `/dashboard/projetos/novo?stage=${stage}`;

  if ((!texto || texto.length < 10) && !imagemFile) {
    redirect(`${base}&erro=${encodeURIComponent("Informe um texto ou anexe uma imagem para análise.")}`);
  }

  if (imagemFile && !IMAGE_MIME_TYPES.has(imagemFile.type)) {
    redirect(`${base}&erro=${encodeURIComponent("Formato de imagem não suportado. Use PNG, JPG ou WebP.")}`);
  }

  if (imagemFile && imagemFile.size > IMAGE_MAX_BYTES) {
    redirect(`${base}&erro=${encodeURIComponent("Imagem muito grande. Envie um arquivo de até 5 MB.")}`);
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    redirect(`${base}&erro=${encodeURIComponent("API Gemini não configurada.")}`);
  }

  let redirectTo = base;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const parts: Part[] = [];

    if (texto) {
      parts.push({
        text: `Texto fornecido pelo usuário:\n${texto}`,
      });
    }

    if (imagemFile) {
      const bytes = Buffer.from(await imagemFile.arrayBuffer());
      parts.push(createPartFromBase64(bytes.toString("base64"), imagemFile.type));
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            descricao: { type: "string" },
            tipoObra: { type: "string" },
            origem: { type: "string" },
            prioridade: { type: "string" },
            statusInicial: { type: "string" },
            dataInicioEstimada: { type: "string" },
            metragemEstimada: { type: "number" },
            valorEstimado: { type: "number" },
            valorGanhoEstimativa: { type: "number" },
            cepObra: { type: "string" },
            logradouroObra: { type: "string" },
            numeroEnderecoObra: { type: "string" },
            complementoObra: { type: "string" },
            bairroObra: { type: "string" },
            cidadeObra: { type: "string" },
            estadoObra: { type: "string" },
            clienteNome: { type: "string" },
            clienteTelefone: { type: "string" },
            pendencias: { type: "array", items: { type: "string" } },
            tarefasSugeridas: { type: "array", items: { type: "string" } },
            itensSemDestino: { type: "array", items: { type: "string" } },
          },
          required: [
            "titulo", "descricao", "tipoObra", "origem", "prioridade",
            "statusInicial", "dataInicioEstimada", "metragemEstimada", "valorEstimado",
            "valorGanhoEstimativa", "cepObra", "logradouroObra", "numeroEnderecoObra",
            "complementoObra", "bairroObra", "cidadeObra", "estadoObra",
            "clienteNome", "clienteTelefone", "pendencias", "tarefasSugeridas", "itensSemDestino",
          ],
        },
      },
    });

    const data = JSON.parse(response.text ?? "{}") as ExtracaoOportunidade;

    const p = new URLSearchParams();
    p.set("stage", stage);
    p.set("agenteFilled", "1");
    setIf(p, "titulo", data.titulo);
    setIf(p, "descricao", data.descricao?.slice(0, 1800));
    setIf(p, "tipoObra", data.tipoObra);
    setIf(p, "origem", data.origem);
    setIf(p, "prioridade", data.prioridade);
    setIf(p, "statusInicial", data.statusInicial);
    setIf(p, "dataInicio", data.dataInicioEstimada);
    setIf(p, "metragem", data.metragemEstimada);
    setIf(p, "valor", data.valorEstimado);
    setIf(p, "valorGanho", data.valorGanhoEstimativa);
    setIf(p, "cep", data.cepObra);
    setIf(p, "logradouro", data.logradouroObra);
    setIf(p, "numeroEndereco", data.numeroEnderecoObra);
    setIf(p, "complemento", data.complementoObra);
    setIf(p, "bairro", data.bairroObra);
    setIf(p, "cidade", data.cidadeObra);
    setIf(p, "estado", data.estadoObra);
    setIf(p, "clienteNome", data.clienteNome);
    setIf(p, "clienteTel", data.clienteTelefone);
    if (data.pendencias?.length > 0) p.set("pendencias", data.pendencias.join(" · "));
    if (data.tarefasSugeridas?.length > 0) p.set("tarefas", data.tarefasSugeridas.join(" · "));
    if (data.itensSemDestino?.length > 0) p.set("semDestino", data.itensSemDestino.join(" · "));

    redirectTo = `/dashboard/projetos/novo?${p.toString()}`;
  } catch {
    redirect(`${base}&erro=${encodeURIComponent("Erro na análise. Tente novamente.")}`);
  }

  redirect(redirectTo);
}
