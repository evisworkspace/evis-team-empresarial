/*
  Warnings:

  - You are about to drop the column `descricao` on the `projeto_item_orcamento` table. All the data in the column will be lost.
  - You are about to drop the column `preco_estimado` on the `projeto_item_orcamento` table. All the data in the column will be lost.
  - You are about to alter the column `quantidade` on the `projeto_item_orcamento` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,3)` to `Decimal(15,4)`.
  - You are about to alter the column `unidade` on the `projeto_item_orcamento` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - Added the required column `nome` to the `projeto_item_orcamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `projeto_item_orcamento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "projeto_item_orcamento" DROP COLUMN "descricao",
DROP COLUMN "preco_estimado",
ADD COLUMN     "bdi" DECIMAL(10,5),
ADD COLUMN     "custo_servicos" DECIMAL(15,4),
ADD COLUMN     "grupo" VARCHAR(100),
ADD COLUMN     "item_biblioteca_id" UUID,
ADD COLUMN     "nome" VARCHAR(300) NOT NULL,
ADD COLUMN     "parent_id" UUID,
ADD COLUMN     "posicao" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "produtos" DECIMAL(15,4),
ADD COLUMN     "servicos" DECIMAL(15,4),
ADD COLUMN     "tipo" VARCHAR(20) NOT NULL,
ALTER COLUMN "quantidade" SET DATA TYPE DECIMAL(15,4),
ALTER COLUMN "unidade" SET DATA TYPE VARCHAR(20);

-- CreateIndex
CREATE INDEX "projeto_item_orcamento_parent_id_idx" ON "projeto_item_orcamento"("parent_id");

-- AddForeignKey
ALTER TABLE "projeto_item_orcamento" ADD CONSTRAINT "projeto_item_orcamento_item_biblioteca_id_fkey" FOREIGN KEY ("item_biblioteca_id") REFERENCES "item_biblioteca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_item_orcamento" ADD CONSTRAINT "projeto_item_orcamento_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "projeto_item_orcamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
