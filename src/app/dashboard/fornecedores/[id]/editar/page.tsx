import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getFornecedorByEmpresa } from "@/data/fornecedor";
import { editarFornecedor } from "@/actions/fornecedor";
import { EditIcon } from "@/components/Icons";
import EnderecoFields from "@/components/EnderecoFields";

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

          {/* Identificação */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", marginBottom: 12 }}>
            Identificação
          </div>

          <div className="form-group">
            <label className="form-label">Nome / Nome fantasia *</label>
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

          <div className="form-group">
            <label className="form-label">Razão Social</label>
            <input
              name="razaoSocial"
              type="text"
              className="form-input"
              defaultValue={fornecedor.razaoSocial ?? ""}
              placeholder="Nome empresarial (somente PJ)"
              maxLength={200}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tipo de pessoa</label>
              <select name="tipoPessoa" className="form-input form-select" defaultValue={fornecedor.tipoPessoa ?? ""}>
                <option value="">Não informado</option>
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">CPF / CNPJ</label>
              <input
                name="cpfCnpj"
                type="text"
                className="form-input"
                defaultValue={fornecedor.cpfCnpj ?? ""}
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                maxLength={20}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Tipo de fornecedor</label>
            <select name="tipo" className="form-input form-select" defaultValue={fornecedor.tipo}>
              <option value="servico">Prestador de Serviço</option>
              <option value="material">Fornecedor de Material</option>
              <option value="ambos">Serviço + Material</option>
            </select>
          </div>

          {/* Contato */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", marginTop: 24, marginBottom: 12 }}>
            Contato
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Telefone / WhatsApp</label>
              <input
                name="telefone"
                type="tel"
                className="form-input"
                defaultValue={fornecedor.telefone ?? ""}
                placeholder="(11) 99999-9999"
                maxLength={30}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">E-mail</label>
              <input
                name="email"
                type="email"
                className="form-input"
                defaultValue={fornecedor.email ?? ""}
                placeholder="contato@exemplo.com"
                maxLength={200}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Site</label>
            <input
              name="site"
              type="url"
              className="form-input"
              defaultValue={fornecedor.site ?? ""}
              placeholder="https://"
              maxLength={300}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome do responsável</label>
              <input
                name="nomeResponsavel"
                type="text"
                className="form-input"
                defaultValue={fornecedor.nomeResponsavel ?? ""}
                placeholder="Responsável pela empresa"
                maxLength={200}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome do contato / comprador</label>
              <input
                name="nomeContato"
                type="text"
                className="form-input"
                defaultValue={fornecedor.nomeContato ?? ""}
                placeholder="Quem atende pedidos"
                maxLength={200}
              />
            </div>
          </div>

          {/* Categorias */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", marginTop: 24, marginBottom: 12 }}>
            Categorias
          </div>

          <div className="form-group">
            <label className="form-label">Categorias de atuação</label>
            <input
              name="categorias"
              type="text"
              className="form-input"
              defaultValue={fornecedor.categorias ?? ""}
              placeholder="Ex: elétrica, hidráulica, pintura"
              maxLength={500}
            />
            <span className="form-hint">Separe com vírgula.</span>
          </div>

          {/* Endereço */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-muted)", marginTop: 24, marginBottom: 12 }}>
            Endereço
          </div>

          <EnderecoFields
            fieldNames={{ cep: "cep", logradouro: "rua", numero: "numero", complemento: "complemento", bairro: "bairro", cidade: "cidade", estado: "estado" }}
            defaults={{
              cep: fornecedor.cep ?? "",
              logradouro: fornecedor.rua ?? "",
              numero: fornecedor.numero ?? "",
              complemento: fornecedor.complemento ?? "",
              bairro: fornecedor.bairro ?? "",
              cidade: fornecedor.cidade ?? "",
              estado: fornecedor.estado ?? "",
            }}
            marginTop={0}
          />

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
