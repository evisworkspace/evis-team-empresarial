-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "endereco_obra" TEXT,
ADD COLUMN     "metragem_estimada" DECIMAL(10,2),
ADD COLUMN     "prioridade" TEXT,
ADD COLUMN     "tipo_obra" TEXT,
ADD COLUMN     "valor_estimado" DECIMAL(15,2);

-- CreateTable
CREATE TABLE "projeto_atividade" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projeto_atividade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projeto_atividade_projeto_id_created_at_idx" ON "projeto_atividade"("projeto_id", "created_at");

-- CreateIndex
CREATE INDEX "projeto_atividade_empresa_id_idx" ON "projeto_atividade"("empresa_id");

-- AddForeignKey
ALTER TABLE "projeto_atividade" ADD CONSTRAINT "projeto_atividade_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_atividade" ADD CONSTRAINT "projeto_atividade_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
