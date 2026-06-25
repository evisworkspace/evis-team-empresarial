import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmpresaId } from "@/lib/tenant";
import { getClienteByEmpresa } from "@/data/cliente";
import { editarCliente } from "@/actions/cliente";
import { EditIcon } from "@/components/Icons";
import EnderecoFields from "@/components/EnderecoFields";
import { ORIGENS_CONTATO } from "@/lib/origens";

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
            <select name="origemContato" className="form-input form-select" defaultValue={cliente.origemContato ?? ""}>
              <option value="">Não informada</option>
              {ORIGENS_CONTATO.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* RG e Data de Nascimento */}
          <div className="form-row" style={{ marginTop: 18 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">RG</label>
              <input
                name="rg"
                type="text"
                className="form-input"
                defaultValue={cliente.rg ?? ""}
                placeholder="00.000.000-0"
                maxLength={20}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Data de Nascimento</label>
              <input
                name="dataNascimento"
                type="date"
                className="form-input"
                defaultValue={cliente.dataNascimento ? new Date(cliente.dataNascimento).toISOString().split("T")[0] : ""}
              />
            </div>
          </div>

          {/* Dados de identificação */}
          <div className="form-group" style={{ marginTop: 24 }}>
            <label className="form-label">Razão Social</label>
            <input
              name="razaoSocial"
              type="text"
              className="form-input"
              defaultValue={cliente.razaoSocial ?? ""}
              placeholder="Nome empresarial (somente PJ)"
              maxLength={200}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">E-mail</label>
              <input
                name="email"
                type="email"
                className="form-input"
                defaultValue={cliente.email ?? ""}
                placeholder="contato@exemplo.com"
                maxLength={200}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">CPF / CNPJ</label>
              <input
                name="cpfCnpj"
                type="text"
                className="form-input"
                defaultValue={cliente.cpfCnpj ?? ""}
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                maxLength={20}
              />
            </div>
          </div>

          {/* Endereço */}
          <EnderecoFields
            fieldNames={{ cep: "cep", logradouro: "rua", numero: "numero", complemento: "complemento", bairro: "bairro", cidade: "cidade", estado: "estado" }}
            defaults={{ cep: cliente.cep ?? "", logradouro: cliente.rua ?? "", numero: cliente.numero ?? "", complemento: cliente.complemento ?? "", bairro: cliente.bairro ?? "", cidade: cliente.cidade ?? "", estado: cliente.estado ?? "" }}
          />

          {/* Observações */}
          <div className="form-group" style={{ marginTop: 24 }}>
            <label className="form-label">Observações</label>
            <textarea
              name="observacoes"
              className="form-input form-textarea"
              defaultValue={cliente.observacoes ?? ""}
              placeholder="Notas sobre o cliente..."
              maxLength={1000}
              rows={3}
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
