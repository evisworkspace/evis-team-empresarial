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
          <div className="form-group" style={{ marginTop: 24 }}>
            <label className="form-label">CEP</label>
            <input
              name="cep"
              type="text"
              className="form-input"
              defaultValue={cliente.cep ?? ""}
              placeholder="00000-000"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rua / Logradouro</label>
            <input
              name="rua"
              type="text"
              className="form-input"
              defaultValue={cliente.rua ?? ""}
              placeholder="Rua, Avenida, Estrada..."
              maxLength={200}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Número</label>
              <input
                name="numero"
                type="text"
                className="form-input"
                defaultValue={cliente.numero ?? ""}
                placeholder="Ex: 123"
                maxLength={20}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Complemento</label>
              <input
                name="complemento"
                type="text"
                className="form-input"
                defaultValue={cliente.complemento ?? ""}
                placeholder="Apto, Sala, Bloco..."
                maxLength={100}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bairro</label>
            <input
              name="bairro"
              type="text"
              className="form-input"
              defaultValue={cliente.bairro ?? ""}
              placeholder="Bairro"
              maxLength={100}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cidade</label>
              <input
                name="cidade"
                type="text"
                className="form-input"
                defaultValue={cliente.cidade ?? ""}
                placeholder="Cidade"
                maxLength={100}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estado</label>
              <input
                name="estado"
                type="text"
                className="form-input"
                defaultValue={cliente.estado ?? ""}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

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
