"use client";

import RdiPanel from "@/components/obra/RdiPanel";

interface RdiTabProps {
  projetoId: string;
  projetoTitulo: string;
}

export default function RdiTab({ projetoId, projetoTitulo }: RdiTabProps) {
  return (
    <div className="obra-card obra-card--full">
      <div className="obra-card-header">
        <span>Registro Operacional</span>
      </div>
      <div style={{ padding: "0 0 16px" }}>
        <RdiPanel projetoId={projetoId} projetoTitulo={projetoTitulo} />
      </div>
    </div>
  );
}
