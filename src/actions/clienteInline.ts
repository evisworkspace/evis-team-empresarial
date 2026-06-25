"use server"
import { auth } from "@/lib/auth"
import { getEmpresaId } from "@/lib/tenant"
import { createCliente } from "@/data/cliente"
import { createAuditEntry } from "@/lib/audit"

export type ClienteInlineState = {
  clienteId: string | null
  clienteNome: string | null
  error: string | null
}

export async function criarClienteInline(
  _prev: ClienteInlineState,
  formData: FormData,
): Promise<ClienteInlineState> {
  try {
    const session = await auth()
    const empresaId = getEmpresaId(session!)

    const nome = (formData.get("nome") as string)?.trim()
    if (!nome || nome.length < 2) {
      return { clienteId: null, clienteNome: null, error: "Nome é obrigatório." }
    }

    const dataNascimentoRaw = formData.get("dataNascimento") as string
    const dataNascimento = dataNascimentoRaw ? new Date(dataNascimentoRaw) : undefined

    const cliente = await createCliente(empresaId, {
      nome,
      telefone: (formData.get("telefone") as string)?.trim() || undefined,
      tipoPessoa: (formData.get("tipoPessoa") as string) || "PF",
      origemContato: (formData.get("origemContato") as string)?.trim() || undefined,
      razaoSocial: (formData.get("razaoSocial") as string)?.trim() || undefined,
      email: (formData.get("email") as string)?.trim() || undefined,
      cpfCnpj: (formData.get("cpfCnpj") as string)?.trim() || undefined,
      cep: (formData.get("cep") as string)?.trim() || undefined,
      rua: (formData.get("rua") as string)?.trim() || undefined,
      numero: (formData.get("numero") as string)?.trim() || undefined,
      complemento: (formData.get("complemento") as string)?.trim() || undefined,
      bairro: (formData.get("bairro") as string)?.trim() || undefined,
      cidade: (formData.get("cidade") as string)?.trim() || undefined,
      estado: (formData.get("estado") as string)?.trim() || undefined,
      observacoes: (formData.get("observacoes") as string)?.trim() || undefined,
      rg: (formData.get("rg") as string)?.trim() || undefined,
      dataNascimento,
    })

    await createAuditEntry({
      empresaId,
      eventoTipo: "criacao",
      entidadeTipo: "cliente",
      entidadeId: cliente.id,
      conteudoPersistido: { nome, tipoPessoa: cliente.tipoPessoa },
    })

    return { clienteId: cliente.id, clienteNome: nome, error: null }
  } catch {
    return { clienteId: null, clienteNome: null, error: "Erro ao salvar. Tente novamente." }
  }
}
