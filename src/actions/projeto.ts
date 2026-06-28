"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createProjeto, listProjetosByEmpresa, updateProjeto, softDeleteProjeto } from "@/data/projeto";
import { createCliente, updateCliente } from "@/data/cliente";
import { createAuditEntry } from "@/lib/audit";
import { createAtividade, editAtividade, deleteAtividade } from "@/data/projetoAtividade";
import { createTarefa } from "@/data/tarefa";

function extrairDataPrevistaTarefa(texto: string) {
  const dataHoraMatch = texto.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(?:às\s+|as\s+)?(\d{1,2}):(\d{2})/i);
  if (!dataHoraMatch) return undefined;

  const [, diaRaw, mesRaw, anoRaw, horaRaw, minutoRaw] = dataHoraMatch;
  const dia = Number(diaRaw);
  const mes = Number(mesRaw);
  const hora = Number(horaRaw);
  const minuto = Number(minutoRaw);
  const ano = anoRaw
    ? Number(anoRaw.length === 2 ? `20${anoRaw}` : anoRaw)
    : new Date().getFullYear();

  const data = new Date(ano, mes - 1, dia, hora, minuto);
  if (
    Number.isNaN(data.getTime()) ||
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return undefined;
  }

  return data;
}

export async function criarProjeto(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const clienteMode = (formData.get("clienteMode") as string) || "existente";
  let clienteId: string;

  if (clienteMode === "novo") {
    const novoNome = (formData.get("novoClienteNome") as string)?.trim();
    const novoTelefone = (formData.get("novoClienteTelefone") as string)?.trim() || undefined;
    const novoOrigem = (formData.get("novoClienteOrigem") as string)?.trim() || undefined;

    if (!novoNome || novoNome.length < 2) throw new Error("Nome do cliente é obrigatório.");

    const novoCliente = await createCliente(empresaId, {
      nome: novoNome,
      telefone: novoTelefone,
      origemContato: novoOrigem,
    });

    await createAuditEntry({
      empresaId,
      eventoTipo: "criacao",
      entidadeTipo: "cliente",
      entidadeId: novoCliente.id,
      conteudoPersistido: { nome: novoNome, criado_em: "nova_oportunidade" },
    });

    clienteId = novoCliente.id;
  } else {
    clienteId = (formData.get("clienteId") as string)?.trim();
    if (!clienteId) throw new Error("Selecione um cliente ou crie um novo lead.");
  }

  const titulo = (formData.get("titulo") as string)?.trim();
  const stage = (formData.get("stage") as string) || "oportunidade";
  const descricao = (formData.get("descricao") as string)?.trim() || undefined;
  const origem = (formData.get("origem") as string)?.trim() || undefined;
  const numeroObra = (formData.get("numeroObra") as string)?.trim() || undefined;
  const tipoObra = (formData.get("tipoObra") as string)?.trim() || undefined;
  const prioridade = (formData.get("prioridade") as string)?.trim() || undefined;
  const enderecoObra = (formData.get("enderecoObra") as string)?.trim() || undefined;
  const metragemRaw = (formData.get("metragemEstimada") as string)?.trim();
  const valorRaw = (formData.get("valorEstimado") as string)?.trim();
  const valorGanhoRaw = (formData.get("valorGanhoEstimativa") as string)?.trim();
  const dataInicioEstimadaStr = (formData.get("dataInicioEstimada") as string)?.trim();
  const statusInicialParam = (formData.get("statusInicial") as string)?.trim();
  const dataDeGanhoRaw = (formData.get("dataDeGanho") as string)?.trim();
  const dataDeGanho = dataDeGanhoRaw ? new Date(dataDeGanhoRaw) : undefined;
  const cepObra = (formData.get("cepObra") as string)?.trim() || undefined;
  const logradouroObra = (formData.get("logradouroObra") as string)?.trim() || undefined;
  const numeroEnderecoObra = (formData.get("numeroEnderecoObra") as string)?.trim() || undefined;
  const complementoObra = (formData.get("complementoObra") as string)?.trim() || undefined;
  const bairroObra = (formData.get("bairroObra") as string)?.trim() || undefined;
  const cidadeObra = (formData.get("cidadeObra") as string)?.trim() || undefined;
  const estadoObra = (formData.get("estadoObra") as string)?.trim() || undefined;

  if (!titulo || titulo.length < 2) throw new Error("Título é obrigatório.");

  const metragemEstimada = metragemRaw ? parseFloat(metragemRaw.replace(",", ".")) || undefined : undefined;
  const valorEstimado = valorRaw ? parseFloat(valorRaw.replace(",", ".")) || undefined : undefined;
  const valorGanhoEstimativa = valorGanhoRaw ? parseFloat(valorGanhoRaw.replace(",", ".")) || undefined : undefined;
  const dataInicioEstimada = dataInicioEstimadaStr ? new Date(dataInicioEstimadaStr) : undefined;

  const STATUS_FUNIL = ["novo", "fila_espera", "em_andamento", "proposta_enviada", "em_negociacao", "ganho", "perdido"];
  const STATUS_OBRA_LISTA = ["abertura", "planejamento", "em_andamento", "pausada", "concluida", "entregue", "encerrada"];
  const statusInterno =
    stage === "obra"
      ? (statusInicialParam && STATUS_OBRA_LISTA.includes(statusInicialParam) ? statusInicialParam : "abertura")
      : (statusInicialParam && STATUS_FUNIL.includes(statusInicialParam) ? statusInicialParam : "novo");

  const projeto = await createProjeto(empresaId, {
    clienteId,
    titulo,
    descricao,
    stage,
    statusInterno,
    origem,
    tipoObra,
    prioridade,
    metragemEstimada,
    valorEstimado,
    valorGanhoEstimativa,
    enderecoObra,
    numeroObra,
    dataInicioEstimada,
    dataDeGanho,
    cepObra,
    logradouroObra,
    numeroEnderecoObra,
    complementoObra,
    bairroObra,
    cidadeObra,
    estadoObra,
  });

  await createAuditEntry({
    empresaId,
    projetoId: projeto.id,
    eventoTipo: "criacao",
    entidadeTipo: "projeto",
    entidadeId: projeto.id,
    conteudoPersistido: { titulo, stage, clienteId },
  });

  if (stage === "oportunidade") {
    await Promise.all([
      createTarefa(empresaId, {
        projetoId: projeto.id,
        descricao: "Agendar reunião ou visita com o cliente",
        origem: "sugerida_ia",
      }),
      createTarefa(empresaId, {
        projetoId: projeto.id,
        descricao: "Analisar documentação recebida e definir próximo passo",
        origem: "sugerida_ia",
      }),
    ]);

    const tarefasSugeridasRaw = (formData.get("tarefasSugeridas") as string | null)?.trim();
    if (tarefasSugeridasRaw) {
      const tarefasSugeridas = tarefasSugeridasRaw
        .split(" · ")
        .map((tarefa) => tarefa.trim())
        .filter(Boolean);

      await Promise.all(
        tarefasSugeridas.map((descricao) =>
          createTarefa(empresaId, {
            projetoId: projeto.id,
            descricao,
            dataPrevista: extrairDataPrevistaTarefa(descricao),
            status: "aberta",
            origem: "sugerida_ia",
          }),
        ),
      );
    }
  }

  if (stage === "oportunidade") {
    redirect(`/dashboard/projetos/${projeto.id}?lia=1`);
  }

  redirect(`/dashboard/projetos/${projeto.id}`);
}

export async function converterEmObra(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const projetoId = formData.get("projetoId") as string;

  if (!projetoId) throw new Error("ID do projeto obrigatório.");

  const result = await updateProjeto(empresaId, projetoId, {
    stage: "obra",
    statusInterno: "em_andamento",
  });

  if (result.count === 0) throw new Error("Oportunidade não encontrada.");

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "conversao_stage",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { de: "oportunidade", para: "obra" },
  });

  redirect(`/dashboard/projetos/${projetoId}`);
}

// Lote 10C/10D — Completa dados do cliente e converte em obra em sequência.
export async function confirmarConversaoComCliente(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const projetoId = formData.get("projetoId") as string;
  const clienteId = formData.get("clienteId") as string;

  if (!projetoId || !clienteId) throw new Error("Dados obrigatórios ausentes.");

  const nome = (formData.get("clienteNome") as string)?.trim();
  const telefone = (formData.get("clienteTelefone") as string)?.trim() || null;
  const tipoPessoa = (formData.get("clienteTipoPessoa") as string) || "PF";
  const origemContato = (formData.get("clienteOrigemContato") as string)?.trim() || null;

  if (!nome || nome.length < 2) throw new Error("Nome do cliente é obrigatório.");

  await updateCliente(empresaId, clienteId, { nome, telefone, tipoPessoa, origemContato });

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "edicao",
    entidadeTipo: "cliente",
    entidadeId: clienteId,
    conteudoPersistido: { nome, revisado_em: "confirmar_conversao" },
  });

  const result = await updateProjeto(empresaId, projetoId, {
    stage: "obra",
    statusInterno: "em_andamento",
  });

  if (result.count === 0) throw new Error("Oportunidade não encontrada.");

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "conversao_stage",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { de: "oportunidade", para: "obra", cliente_revisado: true },
  });

  redirect(`/dashboard/projetos/${projetoId}`);
}

export async function atualizarStatusFunil(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const projetoId = formData.get("projetoId") as string;
  const novoStatus = formData.get("statusInterno") as string;

  const statusValidos = ["novo", "fila_espera", "orcamento", "proposta_enviada", "em_negociacao", "ganho", "perdido", "em_andamento"];
  if (!projetoId || !novoStatus || !statusValidos.includes(novoStatus)) {
    throw new Error("Dados inválidos.");
  }

  await updateProjeto(empresaId, projetoId, { statusInterno: novoStatus });

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "alteracao_status",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { novoStatus },
  });

  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function editarProjeto(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const projetoId = formData.get("projetoId") as string;
  const titulo = (formData.get("titulo") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const numeroObra = (formData.get("numeroObra") as string)?.trim() || null;
  const origem = (formData.get("origem") as string)?.trim() || null;
  const tipoObra = (formData.get("tipoObra") as string)?.trim() || null;
  const prioridade = (formData.get("prioridade") as string)?.trim() || null;
  const enderecoObra = (formData.get("enderecoObra") as string)?.trim() || null;
  const metragemRaw = (formData.get("metragemEstimada") as string)?.trim();
  const valorRaw = (formData.get("valorEstimado") as string)?.trim();
  const valorGanhoRaw = (formData.get("valorGanhoEstimativa") as string)?.trim();
  const dataInicioEstimadaStr = (formData.get("dataInicioEstimada") as string)?.trim();
  const dataDeGanhoStr = (formData.get("dataDeGanho") as string)?.trim();
  const cepObra = (formData.get("cepObra") as string)?.trim() || null;
  const logradouroObra = (formData.get("logradouroObra") as string)?.trim() || null;
  const numeroEnderecoObra = (formData.get("numeroEnderecoObra") as string)?.trim() || null;
  const complementoObra = (formData.get("complementoObra") as string)?.trim() || null;
  const bairroObra = (formData.get("bairroObra") as string)?.trim() || null;
  const cidadeObra = (formData.get("cidadeObra") as string)?.trim() || null;
  const estadoObra = (formData.get("estadoObra") as string)?.trim() || null;

  if (!projetoId || !titulo || titulo.length < 2) {
    throw new Error("Título é obrigatório.");
  }

  const metragemEstimada = metragemRaw ? parseFloat(metragemRaw.replace(",", ".")) || null : null;
  const valorEstimado = valorRaw ? parseFloat(valorRaw.replace(",", ".")) || null : null;
  const valorGanhoEstimativa = valorGanhoRaw ? parseFloat(valorGanhoRaw.replace(",", ".")) || null : null;
  const dataInicioEstimada = dataInicioEstimadaStr ? new Date(dataInicioEstimadaStr) : null;
  const dataDeGanho = dataDeGanhoStr ? new Date(dataDeGanhoStr) : null;

  const result = await updateProjeto(empresaId, projetoId, {
    titulo,
    descricao,
    numeroObra,
    origem,
    tipoObra,
    prioridade,
    metragemEstimada,
    valorEstimado,
    valorGanhoEstimativa,
    enderecoObra,
    dataInicioEstimada,
    dataDeGanho,
    cepObra,
    logradouroObra,
    numeroEnderecoObra,
    complementoObra,
    bairroObra,
    cidadeObra,
    estadoObra,
  });

  if (result.count === 0) throw new Error("Projeto não encontrado.");

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "edicao",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { titulo },
  });

  redirect(`/dashboard/projetos/${projetoId}`);
}

export async function atualizarStatusObra(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const projetoId = formData.get("projetoId") as string;
  const novoStatus = formData.get("statusInterno") as string;

  const statusValidos = [
    "abertura",
    "planejamento",
    "em_andamento",
    "pausada",
    "concluida",
    "entregue",
    "encerrada",
  ];
  if (!projetoId || !novoStatus || !statusValidos.includes(novoStatus)) {
    throw new Error("Dados inválidos.");
  }

  await updateProjeto(empresaId, projetoId, { statusInterno: novoStatus });

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "alteracao_status",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { novoStatus },
  });

  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function reverterParaOportunidade(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const projetoId = formData.get("projetoId") as string;

  if (!projetoId) throw new Error("ID obrigatório.");

  const result = await updateProjeto(empresaId, projetoId, {
    stage: "oportunidade",
    statusInterno: "ganho",
    numeroObra: null,
  });

  if (result.count === 0) throw new Error("Obra não encontrada.");

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "conversao_stage",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { de: "obra", para: "oportunidade", motivo: "reversao_manual" },
  });

  redirect(`/dashboard/projetos/${projetoId}`);
}

export async function criarAtividadeProjeto(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const projetoId = formData.get("projetoId") as string;
  const tipo = (formData.get("tipo") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim();

  const tiposValidos = ["ligacao", "visita", "email", "reuniao", "nota", "outro"];
  if (!projetoId || !tipo || !tiposValidos.includes(tipo) || !descricao || descricao.length < 2) {
    throw new Error("Dados inválidos para registrar atividade.");
  }

  await createAtividade(empresaId, { projetoId, tipo, descricao });

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "edicao",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { acao: "atividade_registrada", tipo },
  });

  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function editarAtividade(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const atividadeId = formData.get("atividadeId") as string;
  const projetoId = formData.get("projetoId") as string;
  const descricao = (formData.get("descricao") as string)?.trim();

  if (!atividadeId || !projetoId || !descricao || descricao.length < 2) {
    throw new Error("Descrição é obrigatória.");
  }

  await editAtividade(empresaId, atividadeId, { descricao });

  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function deletarAtividade(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const atividadeId = formData.get("atividadeId") as string;
  const projetoId = formData.get("projetoId") as string;

  if (!atividadeId || !projetoId) throw new Error("Dados obrigatórios.");

  await deleteAtividade(empresaId, atividadeId);

  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function moverEtapaKanban(projetoId: string, novoStatus: string) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const statusValidos = ["novo", "fila_espera", "orcamento", "proposta_enviada", "em_negociacao", "ganho", "perdido", "em_andamento"];
  if (!projetoId || !novoStatus || !statusValidos.includes(novoStatus)) {
    throw new Error("Dados inválidos.");
  }

  await updateProjeto(empresaId, projetoId, { statusInterno: novoStatus });

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "alteracao_status",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { novoStatus },
  });

  revalidatePath("/dashboard/projetos");
}

export async function moverStatusObra(projetoId: string, novoStatus: string) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const statusValidos = ["abertura", "planejamento", "em_andamento", "pausada", "concluida", "entregue", "encerrada"];
  if (!projetoId || !novoStatus || !statusValidos.includes(novoStatus)) {
    throw new Error("Dados inválidos.");
  }

  await updateProjeto(empresaId, projetoId, { statusInterno: novoStatus });

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "alteracao_status",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { novoStatus },
  });

  revalidatePath("/dashboard/projetos");
}

export async function atualizarStatusProjeto(projetoId: string, novoStatus: string) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  if (!projetoId || !novoStatus) throw new Error("Dados inválidos.");

  await updateProjeto(empresaId, projetoId, { statusInterno: novoStatus });

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "alteracao_status",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { novoStatus },
  });

  revalidatePath("/dashboard/projetos");
}

export async function finalizarProjeto(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const projetoId = formData.get("projetoId") as string;
  const stage = formData.get("stage") as string;

  if (!projetoId) throw new Error("ID obrigatório.");

  const statusFinal = stage === "oportunidade" ? "ganho" : "concluida";
  await updateProjeto(empresaId, projetoId, { statusInterno: statusFinal });

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "alteracao_status",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { novoStatus: statusFinal, acao: "finalizar" },
  });

  revalidatePath("/dashboard/projetos");
}

export async function cancelarProjeto(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const projetoId = formData.get("projetoId") as string;
  const stage = formData.get("stage") as string;

  if (!projetoId) throw new Error("ID obrigatório.");

  const statusCancelado = stage === "oportunidade" ? "perdido" : "encerrada";
  await updateProjeto(empresaId, projetoId, { statusInterno: statusCancelado });

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "alteracao_status",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { novoStatus: statusCancelado, acao: "cancelar" },
  });

  revalidatePath("/dashboard/projetos");
}

export async function excluirProjeto(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const projetoId = formData.get("projetoId") as string;

  if (!projetoId) throw new Error("ID obrigatório.");

  const result = await softDeleteProjeto(empresaId, projetoId);
  if (result.count === 0) throw new Error("Projeto não encontrado.");

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "edicao",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { acao: "excluir" },
  });

  revalidatePath("/dashboard/projetos");
}

export async function provaFluxoListarProjetos() {
  const session = await auth();
  const empresaId = getEmpresaId(session);

  const projetos = await listProjetosByEmpresa(empresaId, { take: 10 });

  await createAuditEntry({
    empresaId,
    eventoTipo: "validacao_ia",
    entidadeTipo: "projeto",
    entidadeId: empresaId,
    usuarioId: null,
    conteudoPersistido: {
      acao: "prova_fluxo_listar_projetos",
      totalRetornado: projetos.length,
    },
    origemInformacao: "scaffold:lote3c:prova",
  });

  return { total: projetos.length };
}

export async function trocarClienteProjeto(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const projetoId = formData.get("projetoId") as string;
  const clienteId = formData.get("clienteId") as string;

  if (!projetoId || !clienteId) throw new Error("Dados obrigatórios.");

  const result = await updateProjeto(empresaId, projetoId, { clienteId });
  if (result.count === 0) throw new Error("Projeto não encontrado.");

  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function deletarProjeto(formData: FormData) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);

  const projetoId = formData.get("projetoId") as string;
  if (!projetoId) throw new Error("projetoId obrigatório.");

  const result = await softDeleteProjeto(empresaId, projetoId);
  if (result.count === 0) throw new Error("Projeto não encontrado.");

  await createAuditEntry({
    empresaId,
    projetoId,
    eventoTipo: "edicao",
    entidadeTipo: "projeto",
    entidadeId: projetoId,
    conteudoPersistido: { acao: "excluir", origem: "tela_edicao" },
  });

  revalidatePath("/dashboard/projetos");

  redirect("/dashboard/projetos");
}
