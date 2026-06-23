import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getFornecedorByEmpresa } from "@/data/fornecedor";
import { editarFornecedor } from "@/actions/fornecedor";
import { EditIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Editar Fornecedor" };

export default async function EditarFornecedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { id } = await params;

  const fornecedor = await getFornecedorByEmpresa(empresaId, id);
  if (!fornecedor) notFound();

  return (
    <div>
      <Link href={`/dashboard/fornecedores/${id}`} className="back-link">
        ← {fornecedor.nome}
      </Link>

      <div className="form-card">
        <div className="form-card-title">Editar fornecedor</div>
        <p className="form-card-sub">Altere os dados cadastrais do fornecedor.</p>

        <form action={editarFornecedor}>
          <input type="hidden" name="fornecedorId" value={fornecedor.id} />

          {/* Nome */}
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input
              name="nome"
              type="text"
              className="form-input"
              defaultValue={fornecedor.nome}
              required
              minLength={2}
              maxLength={200}
            />
          </div>

          {/* Tipo */}
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select name="tipo" className="form-input" defaultValue={fornecedor.tipo}>
              <option value="servico">Prestador de Serviço</option>
              <option value="material">Fornecedor de Material</option>
              <option value="ambos">Serviço + Material</option>
            </select>
          </div>

          {/* Contato */}
          <div className="form-group">
            <label className="form-label">Contato / Telefone</label>
            <input
              name="contato"
              type="tel"
              className="form-input"
              defaultValue={fornecedor.contato ?? ""}
              placeholder="(11) 99999-9999"
              maxLength={30}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <EditIcon size={15} />
              Salvar alterações
            </button>
            <Link href={`/dashboard/fornecedores/${id}`} className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
