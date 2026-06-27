-- Agenda operacional do sistema, alimentada manualmente ou por HITL da Lia.
CREATE TABLE "agenda_item" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "projeto_id" UUID,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "tipo" VARCHAR(40) NOT NULL DEFAULT 'compromisso',
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "status" VARCHAR(30) NOT NULL DEFAULT 'agendado',
    "origem" VARCHAR(30) NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agenda_item_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agenda_item_empresa_id_inicio_idx" ON "agenda_item"("empresa_id", "inicio");
CREATE INDEX "agenda_item_projeto_id_inicio_idx" ON "agenda_item"("projeto_id", "inicio");

ALTER TABLE "agenda_item"
ADD CONSTRAINT "agenda_item_empresa_id_fkey"
FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "agenda_item"
ADD CONSTRAINT "agenda_item_projeto_id_fkey"
FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
