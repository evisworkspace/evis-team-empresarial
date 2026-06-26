import type { Metadata } from "next";
import Link from "next/link";
import NovoFornecedorForm from "@/components/NovoFornecedorForm";

export const metadata: Metadata = { title: "Novo Fornecedor" };

export default async function NovoFornecedorPage({
  searchParams,
}: {
  searchParams: Promise<{
    agenteFilled?: string;
    erro?: string;
    nome?: string;
    razaoSocial?: string;
    tipoPessoa?: string;
    cpfCnpj?: string;
    tipo?: string;
    telefone?: string;
    email?: string;
    site?: string;
    nomeResponsavel?: string;
    nomeContato?: string;
    categorias?: string;
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    pendencias?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <Link href="/dashboard/fornecedores" className="back-link">
        ← Fornecedores
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>
          Novo fornecedor / prestador
        </h1>
        <p style={{ fontSize: 14, color: "var(--clr-text-muted)" }}>
          Cadastre prestadores de serviço ou fornecedores de material para organizar suas obras.
        </p>
      </div>

      <NovoFornecedorForm
        agenteFilled={params.agenteFilled}
        erro={params.erro}
        nome={params.nome}
        razaoSocial={params.razaoSocial}
        tipoPessoa={params.tipoPessoa}
        cpfCnpj={params.cpfCnpj}
        tipo={params.tipo}
        telefone={params.telefone}
        email={params.email}
        site={params.site}
        nomeResponsavel={params.nomeResponsavel}
        nomeContato={params.nomeContato}
        categorias={params.categorias}
        cep={params.cep}
        rua={params.rua}
        numero={params.numero}
        complemento={params.complemento}
        bairro={params.bairro}
        cidade={params.cidade}
        estado={params.estado}
        pendencias={params.pendencias}
      />
    </div>
  );
}
