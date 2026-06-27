"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { createTarefa } from "@/data/tarefa";
import { createAtividade } from "@/data/projetoAtividade";

interface AcaoTarefa {
  tipo: "tarefa";
  descricao: string;
  dataPrevista?: string;
  projetoId: string;
}

interface AcaoAtividade {
  tipo: "atividade";
  descricao: string;
  tipoAtividade?: string;
  projetoId: string;
}

type Acao = AcaoTarefa | AcaoAtividade;

function parseDataPrevista(value?: string) {
  if (!value) return undefined;
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return undefined;
  return data;
}

export async function executarAcaoLia(acao: Acao): Promise<{ ok: boolean; erro?: string }> {
  const session = await auth();
  const empresaId = getEmpresaId(session);

  if (!acao.projetoId) {
    return {
      ok: false,
      erro: "Projeto não identificado. Abra um projeto antes de confirmar a ação.",
    };
  }

  if (!acao.descricao || acao.descricao.trim().length < 2) {
    return { ok: false, erro: "Descrição da ação inválida." };
  }

  try {
    if (acao.tipo === "tarefa") {
      await createTarefa(empresaId, {
        projetoId: acao.projetoId,
        descricao: acao.descricao.trim(),
        dataPrevista: parseDataPrevista(acao.dataPrevista),
        status: "aberta",
        origem: "sugerida_ia",
      });
      revalidatePath(`/dashboard/projetos/${acao.projetoId}`);
      revalidatePath("/dashboard/tarefas");
      return { ok: true };
    }

    const tiposValidos = ["ligacao", "visita", "email", "reuniao", "nota", "outro"];
    const tipo = acao.tipoAtividade && tiposValidos.includes(acao.tipoAtividade)
      ? acao.tipoAtividade
      : "nota";

    await createAtividade(empresaId, {
      projetoId: acao.projetoId,
      tipo,
      descricao: acao.descricao.trim(),
    });
    revalidatePath(`/dashboard/projetos/${acao.projetoId}`);
    revalidatePath("/dashboard/diario");
    return { ok: true };
  } catch (error) {
    console.error("[executarAcaoLia]", error);
    return { ok: false, erro: "Erro ao executar ação." };
  }
}
