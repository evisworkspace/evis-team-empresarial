-- AlterTable
ALTER TABLE "lancamento_financeiro" ADD COLUMN     "categoria_financeira_id" UUID,
ADD COLUMN     "centro_de_custo_id" UUID,
ADD COLUMN     "conta_bancaria" VARCHAR(100),
ADD COLUMN     "desconto" DECIMAL(15,2),
ADD COLUMN     "forma_pagamento" VARCHAR(50),
ADD COLUMN     "juros" DECIMAL(15,2),
ADD COLUMN     "multa" DECIMAL(15,2),
ADD COLUMN     "nota_fiscal" VARCHAR(200),
ADD COLUMN     "numero_parcela" INTEGER,
ADD COLUMN     "total_parcelas" INTEGER,
ADD COLUMN     "valor_total" DECIMAL(15,2);

-- CreateIndex
CREATE INDEX "lancamento_financeiro_categoria_financeira_id_idx" ON "lancamento_financeiro"("categoria_financeira_id");

-- CreateIndex
CREATE INDEX "lancamento_financeiro_centro_de_custo_id_idx" ON "lancamento_financeiro"("centro_de_custo_id");

-- AddForeignKey
ALTER TABLE "lancamento_financeiro" ADD CONSTRAINT "lancamento_financeiro_categoria_financeira_id_fkey" FOREIGN KEY ("categoria_financeira_id") REFERENCES "categoria_financeira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamento_financeiro" ADD CONSTRAINT "lancamento_financeiro_centro_de_custo_id_fkey" FOREIGN KEY ("centro_de_custo_id") REFERENCES "centro_de_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
