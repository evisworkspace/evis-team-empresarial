"use client";

import Link from "next/link";
import { criarCliente } from "@/actions/cliente";
import { preencherClienteComAgente } from "@/actions/ai/preencherClienteComAgente";
import { PlusIcon } from "@/components/Icons";
import CapturaOperacionalPanel from "@/components/CapturaOperacionalPanel";
import ClienteFormFields from "@/components/ClienteFormFields";

interface Props {
  redirectTo?: string;
  agenteFilled?: string;
  erro?: string;
  // agent-filled fields
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
}

export default function NovoClienteForm(props: Props) {
  return (
    <>
      <CapturaOperacionalPanel
        action={preencherClienteComAgente}
        description="Cole um cartão de visita, conversa de WhatsApp, print ou texto com dados do cliente. O agente preenche os campos — você revisa antes de salvar."
        agenteFilled={props.agenteFilled}
        erro={props.erro}
        pendencias={props.pendencias}
      />

      <div className="form-card">
        <div className="form-card-title">Novo cliente</div>
        <p className="form-card-sub">
          Informe os dados do cliente para vinculá-lo às obras e oportunidades.
        </p>

        <form action={criarCliente}>
          {props.redirectTo && <input type="hidden" name="redirectTo" value={props.redirectTo} />}
          <ClienteFormFields defaults={props} />

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <PlusIcon size={15} />
              Salvar cliente
            </button>
            <Link href="/dashboard/clientes" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
