import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Triagem redirecionada | EVIS",
};

export default function TriagemPage() {
  redirect("/dashboard/projetos/novo?stage=oportunidade");
}
