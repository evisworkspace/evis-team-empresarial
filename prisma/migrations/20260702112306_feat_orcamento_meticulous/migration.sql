-- AlterTable
ALTER TABLE "projeto_item_orcamento" ADD COLUMN     "categoria_item_id" UUID,
ADD COLUMN     "classe" VARCHAR(100),
ADD COLUMN     "custo_total" DECIMAL(15,4),
ADD COLUMN     "custo_unitario" DECIMAL(15,4),
ADD COLUMN     "preco_total" DECIMAL(15,4),
ADD COLUMN     "preco_unitario" DECIMAL(15,4),
ADD COLUMN     "tipo_item" VARCHAR(20);

-- CreateIndex
CREATE INDEX "projeto_item_orcamento_tipo_item_idx" ON "projeto_item_orcamento"("tipo_item");

-- CreateIndex
CREATE INDEX "projeto_item_orcamento_categoria_item_id_idx" ON "projeto_item_orcamento"("categoria_item_id");

-- AddForeignKey
ALTER TABLE "projeto_item_orcamento" ADD CONSTRAINT "projeto_item_orcamento_categoria_item_id_fkey" FOREIGN KEY ("categoria_item_id") REFERENCES "categoria_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
