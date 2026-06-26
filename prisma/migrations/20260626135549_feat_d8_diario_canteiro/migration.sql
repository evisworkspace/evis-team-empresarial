-- CreateTable
CREATE TABLE "diario_de_obra" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'rascunho',
    "descricao" TEXT NOT NULL,
    "processado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diario_de_obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diario_item_hitl" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "diario_id" UUID NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "titulo" VARCHAR(300) NOT NULL,
    "descricao" TEXT,
    "prioridade" VARCHAR(30),
    "percentual" DECIMAL(7,4),
    "data_sugerida" DATE,
    "confianca" DECIMAL(3,2) NOT NULL DEFAULT 0.80,
    "motivo_deteccao" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pendente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diario_item_hitl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diario_de_obra_projeto_id_data_idx" ON "diario_de_obra"("projeto_id", "data");

-- CreateIndex
CREATE INDEX "diario_de_obra_empresa_id_idx" ON "diario_de_obra"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "diario_de_obra_projeto_id_numero_key" ON "diario_de_obra"("projeto_id", "numero");

-- CreateIndex
CREATE INDEX "diario_item_hitl_diario_id_idx" ON "diario_item_hitl"("diario_id");

-- CreateIndex
CREATE INDEX "diario_item_hitl_empresa_id_status_idx" ON "diario_item_hitl"("empresa_id", "status");

-- AddForeignKey
ALTER TABLE "diario_de_obra" ADD CONSTRAINT "diario_de_obra_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diario_de_obra" ADD CONSTRAINT "diario_de_obra_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diario_item_hitl" ADD CONSTRAINT "diario_item_hitl_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diario_item_hitl" ADD CONSTRAINT "diario_item_hitl_diario_id_fkey" FOREIGN KEY ("diario_id") REFERENCES "diario_de_obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
