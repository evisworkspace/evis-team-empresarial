import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getClienteByEmpresa } from "@/data/cliente";
import { editarCliente } from "@/actions/cliente";
import { EditIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Editar Cliente" };

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { id } = await params;

  const cliente = await getClienteByEmpresa(empresaId, id);
  if (!cliente) notFound();

  return (
    <div>
      <Link href={`/dashboard/clientes/${id}`} className="back-link">
        ← {cliente.nome}
      </Link>

      <div className="form-card">
        <div className="form-card-title">Editar cliente</div>
        <p className="form-card-sub">Altere os dados cadastrais do cliente.</p>

        <form action={editarCliente}>
          <input type="hidden" name="clienteId" value={cliente.id} />

          {/* Nome */}
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input
              name="nome"
              type="text"
              className="form-input"
              defaultValue={cliente.nome}
              required
              minLength={2}
              maxLength={200}
            />
          </div>

          {/* Tipo */}
          <div className="form-group">
            <label className="form-label">Tipo de pessoa</label>
            <select name="tipoPessoa" className="form-input" defaultValue={cliente.tipoPessoa ?? "PF"}>
              <option value="PF">Pessoa Física (PF)</option>
              <option value="PJ">Pessoa Jurídica (PJ)</option>
            </select>
          </div>

          {/* Telefone */}
          <div className="form-group">
            <label className="form-label">Telefone / WhatsApp</label>
            <input
              name="telefone"
              type="tel"
              className="form-input"
              defaultValue={cliente.telefone ?? ""}
              placeholder="(11) 99999-9999"
              maxLength={30}
            />
          </div>

          {/* Origem */}
          <div className="form-group">
            <label className="form-label">Origem do contato</label>
            <input
              name="origemContato"
              type="text"
              className="form-input"
              defaultValue={cliente.origemContato ?? ""}
              placeholder="Ex: Indicação, Instagram, WhatsApp"
              maxLength={100}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <EditIcon size={15} />
              Salvar alterações
            </button>
            <Link href={`/dashboard/clientes/${id}`} className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
