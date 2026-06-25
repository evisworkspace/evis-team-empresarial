import { put } from "@vercel/blob"

export async function uploadArquivo(arquivo: File, pasta: string): Promise<string> {
  const nome = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const caminho = `${pasta}/${Date.now()}-${nome}`
  const { url } = await put(caminho, arquivo, { access: "public" })
  return url
}
