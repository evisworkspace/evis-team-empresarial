-- AlterTable
ALTER TABLE "projeto" ADD COLUMN "codigo_sequencial" VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX "projeto_empresa_id_codigo_sequencial_key" ON "projeto"("empresa_id", "codigo_sequencial");
