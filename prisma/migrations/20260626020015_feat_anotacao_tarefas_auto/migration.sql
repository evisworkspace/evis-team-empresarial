-- AlterTable
ALTER TABLE "projeto_item_orcamento" ADD COLUMN     "data_fim_plano" DATE,
ADD COLUMN     "data_inicio_plano" DATE,
ADD COLUMN     "dias_duracao" INTEGER,
ADD COLUMN     "responsavel" VARCHAR(150);

-- CreateTable
CREATE TABLE "anotacao" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "titulo" VARCHAR(200),
    "conteudo" TEXT NOT NULL,
    "visivel_cliente" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "anotacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicao" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "data_referencia" DATE NOT NULL,
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicao_item" (
    "id" UUID NOT NULL,
    "medicao_id" UUID NOT NULL,
    "item_orcamento_id" UUID NOT NULL,
    "valor_medido" DECIMAL(15,2),
    "quantidade_medida" DECIMAL(15,4),
    "percentual_medido" DECIMAL(7,4),

    CONSTRAINT "medicao_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anotacao_projeto_id_created_at_idx" ON "anotacao"("projeto_id", "created_at");

-- CreateIndex
CREATE INDEX "anotacao_empresa_id_idx" ON "anotacao"("empresa_id");

-- CreateIndex
CREATE INDEX "medicao_projeto_id_idx" ON "medicao"("projeto_id");

-- CreateIndex
CREATE INDEX "medicao_empresa_id_idx" ON "medicao"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "medicao_projeto_id_numero_key" ON "medicao"("projeto_id", "numero");

-- CreateIndex
CREATE INDEX "medicao_item_medicao_id_idx" ON "medicao_item"("medicao_id");

-- CreateIndex
CREATE INDEX "medicao_item_item_orcamento_id_idx" ON "medicao_item"("item_orcamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "medicao_item_medicao_id_item_orcamento_id_key" ON "medicao_item"("medicao_id", "item_orcamento_id");

-- AddForeignKey
ALTER TABLE "anotacao" ADD CONSTRAINT "anotacao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacao" ADD CONSTRAINT "anotacao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicao" ADD CONSTRAINT "medicao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicao" ADD CONSTRAINT "medicao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicao_item" ADD CONSTRAINT "medicao_item_medicao_id_fkey" FOREIGN KEY ("medicao_id") REFERENCES "medicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicao_item" ADD CONSTRAINT "medicao_item_item_orcamento_id_fkey" FOREIGN KEY ("item_orcamento_id") REFERENCES "projeto_item_orcamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
