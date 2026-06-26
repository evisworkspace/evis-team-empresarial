import type { Metadata } from "next";
import Link from "next/link";
import NovoClienteForm from "@/components/NovoClienteForm";

export const metadata: Metadata = { title: "Novo Cliente" };

export default async function NovoClientePage({
  searchParams,
}: {
  searchParams: Promise<{
    redirectTo?: string;
    agenteFilled?: string;
    erro?: string;
    nome?: string;
    tipoPessoa?: string;
    telefone?: string;
    email?: string;
    cpfCnpj?: string;
    origemContato?: string;
    razaoSocial?: string;
    rg?: string;
    dataNascimento?: string;
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    observacoes?: string;
    pendencias?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <Link href="/dashboard/clientes" className="back-link">
        ← Clientes
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>
          Novo cliente
        </h1>
        <p style={{ fontSize: 14, color: "var(--clr-text-muted)" }}>
          Informe os dados do cliente para vinculá-lo às obras e oportunidades.
        </p>
      </div>

      <NovoClienteForm
        redirectTo={params.redirectTo}
        agenteFilled={params.agenteFilled}
        erro={params.erro}
        nome={params.nome}
        tipoPessoa={params.tipoPessoa}
        telefone={params.telefone}
        email={params.email}
        cpfCnpj={params.cpfCnpj}
        origemContato={params.origemContato}
        razaoSocial={params.razaoSocial}
        rg={params.rg}
        dataNascimento={params.dataNascimento}
        cep={params.cep}
        rua={params.rua}
        numero={params.numero}
        complemento={params.complemento}
        bairro={params.bairro}
        cidade={params.cidade}
        estado={params.estado}
        observacoes={params.observacoes}
        pendencias={params.pendencias}
      />
    </div>
  );
}
