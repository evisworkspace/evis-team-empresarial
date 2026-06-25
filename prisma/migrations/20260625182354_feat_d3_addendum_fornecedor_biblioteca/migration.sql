-- AlterTable
ALTER TABLE "item_biblioteca" ADD COLUMN     "fornecedor_id" UUID;

-- AddForeignKey
ALTER TABLE "item_biblioteca" ADD CONSTRAINT "item_biblioteca_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
