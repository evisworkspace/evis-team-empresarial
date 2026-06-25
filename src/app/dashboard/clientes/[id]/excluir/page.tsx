import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getClienteByEmpresa } from "@/data/cliente";
import { excluirCliente } from "@/actions/cliente";

export const metadata: Metadata = { title: "Excluir Cliente" };

export default async function ExcluirClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const empresaId = getEmpresaId(session!);
  const { id } = await params;

  const cliente = await getClienteByEmpresa(empresaId, id);
  if (!cliente) notFound();

  const temProjetos = (cliente.projetos ?? []).length > 0;

  return (
    <div>
      <Link href={`/dashboard/clientes/${id}`} className="back-link">
        ← {cliente.nome}
      </Link>

      <div className="form-card" style={{ maxWidth: 480 }}>
        <div className="form-card-title" style={{ color: "var(--clr-danger)" }}>
          Excluir cliente
        </div>

        {temProjetos ? (
          <>
            <div
              style={{
                background: "#fff1f2",
                border: "1px solid #fca5a5",
                borderRadius: "var(--r-md)",
                padding: "14px 16px",
                marginBottom: 20,
                fontSize: 14,
                color: "#991b1b",
                lineHeight: 1.7,
              }}
            >
              <strong>{cliente.nome}</strong> possui {cliente.projetos.length} projeto{cliente.projetos.length !== 1 ? "s" : ""} ou obra{cliente.projetos.length !== 1 ? "s" : ""} vinculado{cliente.projetos.length !== 1 ? "s" : ""}.
              Exclua ou transfira os projetos antes de excluir o cliente.
            </div>
            <Link href={`/dashboard/clientes/${id}`} className="btn btn-secondary">
              Voltar
            </Link>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: "var(--clr-text-secondary)", marginBottom: 20, lineHeight: 1.7 }}>
              Você está prestes a excluir <strong>{cliente.nome}</strong>.
              Esta ação não pode ser desfeita — o cliente será removido da listagem permanentemente.
            </p>

            <form action={excluirCliente} style={{ display: "flex", gap: 10 }}>
              <input type="hidden" name="clienteId" value={cliente.id} />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ background: "var(--clr-danger)", borderColor: "var(--clr-danger)" }}
              >
                Confirmar exclusão
              </button>
              <Link href={`/dashboard/clientes/${id}`} className="btn btn-secondary">
                Cancelar
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
