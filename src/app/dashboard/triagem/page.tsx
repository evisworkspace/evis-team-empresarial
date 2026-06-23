import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TriagemInbox } from "@/components/triagem/TriagemInbox";

export const metadata: Metadata = {
  title: "Triagem IA — Lia | EVIS",
  description: "Cole uma conversa de WhatsApp e a Lia extrai os dados do lead automaticamente.",
};

export default async function TriagemPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Triagem Inteligente</h1>
            <p className="page-subtitle">
              Cole uma conversa de WhatsApp — a Lia extrai os dados e cria a oportunidade.
            </p>
          </div>
          <div className="triagem-lia-badge">
            <span className="triagem-lia-dot" />
            Lia · Online
          </div>
        </div>
      </div>

      <TriagemInbox />
    </div>
  );
}
